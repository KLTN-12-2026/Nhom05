import { useEffect } from 'react';
import UserLayout from './layout/UserLayout';
import axiosInstance from '../../service/AxiosInstance';

const cartThemeStyles = `
    .bg-paper-surface { background-color: #FFFEFA; }
    .bg-paper-200 { background-color: #EAE5D9; }
    .bg-paper { background-color: #F7F4EE; }
    .bg-wine { background-color: #8E3038; }
    .bg-gold { background-color: #B8860B; }
    .bg-night-bg { background-color: #111210; }
    .bg-night-surface { background-color: #181916; }
    .bg-night-card { background-color: #20221E; }
    .text-ink { color: #1E1F1D; }
    .text-ink-muted { color: #66645E; }
    .text-night-text { color: #EDE9DF; }
    .text-night-muted { color: #96938B; }
    .text-wine { color: #8E3038; }
    .text-gold { color: #B8860B; }
    .border-paper-border { border-color: #E3DDD0; }
    .border-night-border { border-color: #2C2E29; }
    .dark .dark\\:bg-paper-surface { background-color: #FFFEFA; }
    .dark .dark\\:bg-paper-200 { background-color: #EAE5D9; }
    .dark .dark\\:bg-night-surface { background-color: #181916; }
    .dark .dark\\:bg-night-card { background-color: #20221E; }
    .dark .dark\\:bg-night-bg { background-color: #111210; }
    .dark .dark\\:text-night-text { color: #EDE9DF; }
    .dark .dark\\:text-night-muted { color: #96938B; }
    .dark .dark\\:text-gold { color: #B8860B; }
    .dark .dark\\:border-night-border { border-color: #2C2E29; }
`;

const cartStyles = "/* ========================================================\n           TYPOGRAPHY & CSS VARIABLES (STRICTLY IDENTICAL TO HOME)\n           ======================================================== */\n        :root {\n            --font-display: \"Inter\", sans-serif;\n            --font-ui: \"Inter\", sans-serif;\n            --font-metadata: \"Roboto\", sans-serif;\n            --font-editorial: \"Open Sans\", sans-serif;\n        }\n\n        html {\n            scroll-behavior: smooth;\n        }\n\n        body {\n            font-family: var(--font-ui);\n            background-color: #F7F4EE;\n            color: #1E1F1D;\n            overflow-x: hidden;\n            -webkit-font-smoothing: antialiased;\n            transition: background-color 0.4s ease, color 0.4s ease;\n        }\n\n        .dark body {\n            background-color: #111210;\n            color: #EDE9DF;\n        }\n\n        /* Subtle paper grain texture */\n        .paper-grain {\n            background-image: radial-gradient(rgba(30, 31, 29, 0.04) 1px, transparent 0);\n            background-size: 24px 24px;\n        }\n        .dark .paper-grain {\n            background-image: radial-gradient(rgba(237, 233, 223, 0.03) 1px, transparent 0);\n            background-size: 24px 24px;\n        }\n\n        /* Starry background in Dark Mode */\n        #starry-background {\n            position: fixed;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            pointer-events: none;\n            z-index: 0;\n            opacity: 0;\n            transition: opacity 0.5s ease;\n        }\n        .dark #starry-background {\n            opacity: 1;\n        }\n        .star {\n            position: absolute;\n            background: white;\n            border-radius: 50%;\n            opacity: 0.3;\n            animation: twinkle var(--duration, 4s) infinite ease-in-out;\n        }\n        @keyframes twinkle {\n            0%, 100% { opacity: 0.2; transform: scale(0.8); }\n            50% { opacity: 0.8; transform: scale(1.2); }\n        }\n\n        /* Glassmorphism Navbar */\n        .glass-nav {\n            background: rgba(247, 244, 238, 0.88);\n            backdrop-filter: blur(14px);\n            -webkit-backdrop-filter: blur(14px);\n            border-color: rgba(227, 221, 208, 0.8);\n        }\n        .dark .glass-nav {\n            background: rgba(17, 18, 16, 0.90);\n            backdrop-filter: blur(14px);\n            -webkit-backdrop-filter: blur(14px);\n            border-color: rgba(44, 46, 41, 0.8);\n        }\n\n        /* Custom luxury checkbox matching theme */\n        .luxury-checkbox {\n            appearance: none;\n            -webkit-appearance: none;\n            width: 20px;\n            height: 20px;\n            border: 2px solid #C5B7A1;\n            border-radius: 5px;\n            outline: none;\n            cursor: pointer;\n            position: relative;\n            background-color: transparent;\n            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);\n            display: inline-flex;\n            align-items: center;\n            justify-content: center;\n            flex-shrink: 0;\n        }\n        .dark .luxury-checkbox {\n            border-color: #4A5B74;\n        }\n        .luxury-checkbox:checked {\n            background-color: #8E3038;\n            border-color: #8E3038;\n        }\n        .dark .luxury-checkbox:checked {\n            background-color: #D4AF37;\n            border-color: #D4AF37;\n        }\n        .luxury-checkbox:checked::after {\n            content: '';\n            width: 5px;\n            height: 10px;\n            border: solid white;\n            border-width: 0 2px 2px 0;\n            transform: rotate(45deg) translate(-1px, -1px);\n            display: block;\n        }\n        .dark .luxury-checkbox:checked::after {\n            border-color: #111210;\n        }\n\n        /* Select option dark/light theme support */\n        select option {\n            background-color: #FFFEFA;\n            color: #111210;\n        }\n        .dark select option {\n            background-color: #181916;\n            color: #F5F2EB;\n        }\n\n        /* Horizontal Shelf Scrollbar Hidden */\n        .shelf-scroll-container {\n            display: flex;\n            gap: 1.25rem;\n            overflow-x: auto;\n            scroll-behavior: smooth;\n            -ms-overflow-style: none;\n            scrollbar-width: none;\n            padding: 0.25rem 0.25rem 0.75rem 0.25rem;\n        }\n        .shelf-scroll-container::-webkit-scrollbar {\n            display: none;\n        }\n\n        /* Gift Progress Animated Stripes */\n        .progress-striped {\n            background-image: repeating-linear-gradient(\n                45deg,\n                rgba(255, 255, 255, 0.18),\n                rgba(255, 255, 255, 0.18) 10px,\n                transparent 10px,\n                transparent 20px\n            );\n            background-size: 28px 28px;\n            animation: moveStripes 2s linear infinite;\n        }\n        @keyframes moveStripes {\n            from { background-position: 0 0; }\n            to { background-position: 28px 0; }\n        }\n\n        /* Toast notification */\n        #toast-notification {\n            position: fixed;\n            bottom: 28px;\n            right: 28px;\n            z-index: 100;\n            transform: translateY(120%);\n            opacity: 0;\n            transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);\n            pointer-events: none;\n        }\n        #toast-notification.show {\n            transform: translateY(0);\n            opacity: 1;\n            pointer-events: auto;\n        }\n\n        /* Scroll to Top Floating Button */\n        #btnScrollToTop {\n            position: fixed;\n            bottom: 24px;\n            right: 84px;\n            width: 44px;\n            height: 44px;\n            border-radius: 9999px;\n            background-color: #8E3038;\n            color: #ffffff;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            box-shadow: 0 4px 14px rgba(142, 48, 56, 0.35);\n            cursor: pointer;\n            z-index: 40;\n            opacity: 0;\n            visibility: hidden;\n            pointer-events: none;\n            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n        }\n        .dark #btnScrollToTop {\n            background-color: #D4AF37;\n            color: #111210;\n            box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);\n        }\n        #btnScrollToTop.visible {\n            opacity: 1;\n            visibility: visible;\n            pointer-events: auto;\n        }\n        #btnScrollToTop:hover {\n            transform: translateY(-3px);\n        }\n\n        /* Custom luxury scrollbar for cart items */\n        #cart-items-scroll-wrapper {\n            scrollbar-width: thin;\n            scrollbar-color: rgba(142, 48, 56, 0.3) transparent;\n            scrollbar-gutter: stable;\n            max-height: 604px;\n            padding-top: 2px;\n            padding-bottom: 8px;\n        }\n        .dark #cart-items-scroll-wrapper {\n            scrollbar-color: rgba(212, 175, 55, 0.3) transparent;\n        }\n        #cart-items-scroll-wrapper::-webkit-scrollbar {\n            width: 10px;\n        }\n        #cart-items-scroll-wrapper::-webkit-scrollbar-track {\n            background: transparent;\n        }\n        #cart-items-scroll-wrapper::-webkit-scrollbar-thumb {\n            background-color: rgba(142, 48, 56, 0.25);\n            border-radius: 9999px;\n            border: 2px solid transparent;\n            background-clip: content-box;\n        }\n        .dark #cart-items-scroll-wrapper::-webkit-scrollbar-thumb {\n            background-color: rgba(212, 175, 55, 0.25);\n        }\n        #cart-items-scroll-wrapper::-webkit-scrollbar-thumb:hover {\n            background-color: rgba(142, 48, 56, 0.5);\n        }\n        .dark #cart-items-scroll-wrapper::-webkit-scrollbar-thumb:hover {\n            background-color: rgba(212, 175, 55, 0.5);\n        }\n        #cart-toolbar {\n            width: calc(100% - 10px);\n        }\n\n        /* Book cover luxury styling with rounded corners on all 4 sides */\n        .cart-book-cover {\n            border-radius: 12px !important;\n            overflow: hidden !important;\n            isolation: isolate !important;\n            transform: translateZ(0);\n        }\n        .cart-book-cover img {\n            border-radius: 12px !important;\n            width: 100%;\n            height: 100%;\n            object-fit: cover;\n            display: block;\n        }\n\n        /* Chatbot widget */\n        #chatbot-container {\n            position: fixed;\n            bottom: 24px;\n            right: 24px;\n            z-index: 50;\n        }\n        #chat-window {\n            position: absolute;\n            bottom: 60px;\n            right: 0;\n            width: 380px;\n            height: 520px;\n            max-width: calc(100vw - 32px);\n            background: #FFFEFA;\n            border: 1px solid #E3DDD0;\n            border-radius: 18px;\n            box-shadow: 0 20px 45px rgba(0,0,0,0.18);\n            display: flex;\n            flex-direction: column;\n            overflow: hidden;\n            transform: scale(0.92) translateY(20px);\n            opacity: 0;\n            pointer-events: none;\n            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);\n        }\n        .dark #chat-window {\n            background: #181916;\n            border-color: #2C2E29;\n            box-shadow: 0 20px 45px rgba(0,0,0,0.5);\n        }\n        #chat-window.open {\n            transform: scale(1) translateY(0);\n            opacity: 1;\n            pointer-events: auto;\n        }";

export default function CartEnd() {
    useEffect(() => {
        // Keep the React page consistent with the original HTML page's CDN setup.
        window.tailwind = window.tailwind || {};
        window.tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    fontFamily: {
                        sans: ['var(--font-ui)', 'sans-serif'],
                        display: ['var(--font-display)', 'sans-serif'],
                        metadata: ['var(--font-metadata)', 'sans-serif'],
                        'metadata-spec': ['var(--font-metadata)', 'sans-serif'],
                        editorial: ['var(--font-editorial)', 'sans-serif'],
                    },
                    colors: {
                        paper: { 50: '#FAF8F5', 100: '#F5F2EB', 200: '#EAE5D9', DEFAULT: '#F7F4EE', surface: '#FFFEFA', border: '#E3DDD0' },
                        ink: { 50: '#F5F5F4', 300: '#A8A6A1', muted: '#66645E', DEFAULT: '#1E1F1D', pure: '#111210' },
                        wine: { DEFAULT: '#8E3038', light: '#A83B46', dark: '#6F252C' },
                        gold: { DEFAULT: '#B8860B', light: '#D4AF37' },
                        night: { bg: '#111210', surface: '#181916', card: '#20221E', border: '#2C2E29', text: '#EDE9DF', muted: '#96938B' },
                    },
                },
            },
        };

        const loadScript = (id, src) => {
            if (document.getElementById(id)) return;
            const script = document.createElement('script');
            script.id = id;
            script.src = src;
            script.async = false;
            document.head.appendChild(script);
        };

        loadScript('tailwind-cdn', 'https://cdn.tailwindcss.com');
        loadScript('phosphor-icons-cdn', 'https://unpkg.com/@phosphor-icons/web');

        // --- 1. CART STATE MANAGEMENT ---
        let userWalletBalance = 1250;
        let appliedCouponDiscount = 5; // Default coupon discount active
        let appliedCouponName = 'HALM2026';
        let giftTargetThreshold = 30; // Khoai threshold to receive Golden Bookmark

        // Cart items data state
        let cartItems = [];

        // --- 2. CALCULATE & RE-RENDER TOTALS ---
        function recalculateCart() {
            const selectedItems = cartItems.filter(item => item.selected);
            const totalItemsCount = cartItems.length;
            const selectedItemsCount = selectedItems.length;

            // Subtotal
            const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);

            // Discount
            const discount = (subtotal > 0 && appliedCouponDiscount > 0) ? Math.min(appliedCouponDiscount, subtotal) : 0;

            // Final Total
            const total = Math.max(0, subtotal - discount);

            // Remaining balance
            const remainingBalance = Math.max(0, userWalletBalance - total);

            // Update DOM badges and counts
            const headerCartBadge = document.getElementById('header-cart-badge');
            if (headerCartBadge) headerCartBadge.textContent = totalItemsCount;

            const selectAllCountEl = document.getElementById('select-all-count');
            if (selectAllCountEl) selectAllCountEl.textContent = totalItemsCount;

            const summaryItemsCountEl = document.getElementById('summary-items-count');
            if (summaryItemsCountEl) summaryItemsCountEl.textContent = selectedItemsCount;

            const subtotalCountTextEl = document.getElementById('subtotal-count-text');
            if (subtotalCountTextEl) subtotalCountTextEl.textContent = selectedItemsCount;

            // Summary values
            const subtotalEl = document.getElementById('summary-subtotal');
            if (subtotalEl) subtotalEl.textContent = subtotal;

            const discountEl = document.getElementById('summary-discount');
            if (discountEl) discountEl.textContent = discount > 0 ? `-${discount}` : '0';

            const totalEl = document.getElementById('summary-total');
            if (totalEl) totalEl.textContent = total;

            const remainingBalanceEl = document.getElementById('remaining-balance-display');
            if (remainingBalanceEl) remainingBalanceEl.textContent = remainingBalance.toLocaleString();

            const walletBalanceDisplayEl = document.getElementById('wallet-balance-display');
            if (walletBalanceDisplayEl) walletBalanceDisplayEl.textContent = userWalletBalance.toLocaleString();

            const userKhoaiNavEl = document.getElementById('user-khoai-nav');
            if (userKhoaiNavEl) userKhoaiNavEl.textContent = userWalletBalance.toLocaleString();

            // Gift Progress
            const giftNeededKhoaiEl = document.getElementById('gift-needed-khoai');
            const giftProgressPctEl = document.getElementById('gift-progress-pct');
            const giftProgressBarEl = document.getElementById('gift-progress-bar');
            const giftStatusTextEl = document.getElementById('gift-status-text');

            if (subtotal >= giftTargetThreshold) {
                if (giftProgressPctEl) giftProgressPctEl.textContent = '100%';
                if (giftProgressBarEl) giftProgressBarEl.style.width = '100%';
                if (giftStatusTextEl) {
                    giftStatusTextEl.innerHTML = '🎉 Chúc mừng! Bạn đã <b>đủ điều kiện nhận Bookmark mạ vàng HALM</b> kèm đơn này!';
                }
            } else {
                const needed = giftTargetThreshold - subtotal;
                const pct = Math.round((subtotal / giftTargetThreshold) * 100);
                if (giftNeededKhoaiEl) giftNeededKhoaiEl.textContent = `${needed} Khoai`;
                if (giftProgressPctEl) giftProgressPctEl.textContent = `${pct}%`;
                if (giftProgressBarEl) giftProgressBarEl.style.width = `${pct}%`;
                if (giftStatusTextEl) {
                    giftStatusTextEl.innerHTML = `Thuê thêm <b class="text-wine dark:text-gold font-metadata">${needed} Khoai</b> để nhận Bookmark mạ vàng HALM!`;
                }
            }

            // Select all checkbox state
            const checkAllEl = document.getElementById('check-all');
            if (checkAllEl) {
                checkAllEl.checked = totalItemsCount > 0 && selectedItemsCount === totalItemsCount;
            }

            // Empty state toggle
            const emptyStateEl = document.getElementById('cart-empty-state');
            const itemsContainerEl = document.getElementById('cart-items-container');
            const checkoutBtnEl = document.getElementById('btn-checkout');

            if (totalItemsCount === 0) {
                if (emptyStateEl) emptyStateEl.classList.remove('hidden');
                if (itemsContainerEl) itemsContainerEl.classList.add('hidden');
                if (checkoutBtnEl) {
                    checkoutBtnEl.disabled = true;
                    checkoutBtnEl.classList.add('opacity-50', 'cursor-not-allowed');
                }
            } else {
                if (emptyStateEl) emptyStateEl.classList.add('hidden');
                if (itemsContainerEl) itemsContainerEl.classList.remove('hidden');
                if (checkoutBtnEl) {
                    checkoutBtnEl.disabled = selectedItemsCount === 0;
                    checkoutBtnEl.classList.toggle('opacity-50', selectedItemsCount === 0);
                    checkoutBtnEl.classList.toggle('cursor-not-allowed', selectedItemsCount === 0);
                }
            }
        }

        // --- 3. SELECTION & DURATION HANDLERS ---
        function toggleSelectAll(isChecked) {
            cartItems.forEach(item => item.selected = isChecked);
            document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = isChecked);
            recalculateCart();
            showToast('Giỏ Hàng', isChecked ? 'Đã chọn toàn bộ tác phẩm.' : 'Đã bỏ chọn tất cả tác phẩm.');
        }

        function handleItemCheckboxChange(itemId) {
            const item = cartItems.find(i => i.id === itemId);
            if (item) {
                const cb = document.querySelector(`.item-checkbox[data-target="${itemId}"]`);
                if (cb) item.selected = cb.checked;
            }
            recalculateCart();
        }

        function updateItemDuration(itemId, valueString) {
            // valueString format: "days|price"
            const [days, price] = valueString.split('|').map(Number);
            const item = cartItems.find(i => i.id === itemId);
            if (item) {
                item.days = days;
                item.price = price;
                const priceEl = document.getElementById(`price-${itemId}`);
                if (priceEl) priceEl.textContent = price;
                recalculateCart();
                showToast('Thời hạn thuê', `Đã cập nhật ${item.title}: ${days} ngày (${price} Khoai).`);
            }
        }

        // --- 4. ITEM REMOVAL POPUP MODAL HANDLERS ---
        let pendingDeleteTarget = null; // 'selected' or itemId

        function openDeleteConfirmModal(target) {
            pendingDeleteTarget = target;
            let targetItems = [];
            if (target === 'selected') {
                targetItems = cartItems.filter(i => i.selected);
                if (targetItems.length === 0) {
                    showToast('Lưu ý', 'Vui lòng chọn ít nhất 1 tác phẩm để xóa.');
                    return;
                }
            } else {
                const item = cartItems.find(i => i.id === target);
                if (item) targetItems = [item];
            }

            if (targetItems.length === 0) return;

            const titleEl = document.getElementById('delete-modal-title');
            const msgEl = document.getElementById('delete-modal-message');
            const previewListEl = document.getElementById('delete-modal-preview-list');

            if (target === 'selected') {
                if (titleEl) titleEl.textContent = `Xóa ${targetItems.length} Tác Phẩm Đã Chọn?`;
                if (msgEl) msgEl.innerHTML = `Bạn có chắc chắn muốn xóa <b>${targetItems.length} tác phẩm đã chọn</b> khỏi giỏ hàng? Bạn có thể tìm lại và thêm lại sách bất cứ lúc nào.`;
            } else {
                if (titleEl) titleEl.textContent = 'Xác Nhận Xóa Tác Phẩm?';
                if (msgEl) msgEl.innerHTML = `Bạn có chắc chắn muốn xóa tác phẩm <b>"${targetItems[0].title}"</b> khỏi giỏ hàng?`;
            }

            if (previewListEl) {
                previewListEl.innerHTML = targetItems.map(item => `
                    <div class="flex items-center gap-3 p-2 rounded-lg bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border">
                        <img src="${item.cover}" alt="${item.title}" class="w-8 h-11 object-cover rounded shadow-sm shrink-0">
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-ink dark:text-night-text truncate text-xs">${item.title}</div>
                            <div class="text-[10px] text-ink-muted dark:text-night-muted">${item.author} • ${item.days} ngày</div>
                        </div>
                        <div class="font-bold text-xs text-wine dark:text-gold shrink-0 text-right">
                            ${item.price} Khoai
                        </div>
                    </div>
                `).join('');
            }

            const modal = document.getElementById('delete-confirm-modal');
            const dialog = document.getElementById('delete-confirm-modal-dialog');
            if (modal && dialog) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                dialog.classList.remove('scale-95');
                dialog.classList.add('scale-100');
            }
        }

        function closeDeleteConfirmModal() {
            const modal = document.getElementById('delete-confirm-modal');
            const dialog = document.getElementById('delete-confirm-modal-dialog');
            if (modal && dialog) {
                modal.classList.add('opacity-0', 'pointer-events-none');
                dialog.classList.remove('scale-100');
                dialog.classList.add('scale-95');
            }
            pendingDeleteTarget = null;
        }

        function confirmDeleteExecution() {
            if (!pendingDeleteTarget) return;

            if (pendingDeleteTarget === 'selected') {
                const selectedItems = cartItems.filter(i => i.selected);
                const count = selectedItems.length;
                selectedItems.forEach(item => {
                    const cardEl = document.querySelector(`[data-item-id="${item.id}"]`);
                    if (cardEl) {
                        cardEl.style.transition = 'all 0.3s ease';
                        cardEl.style.opacity = '0';
                        cardEl.style.transform = 'scale(0.95)';
                        setTimeout(() => cardEl.remove(), 250);
                    }
                });
                cartItems = cartItems.filter(i => !i.selected);
                setTimeout(() => recalculateCart(), 260);
                showToast('Đã xóa thành công', `Đã loại bỏ ${count} tác phẩm đã chọn khỏi giỏ hàng.`);
            } else {
                const itemId = pendingDeleteTarget;
                const itemIndex = cartItems.findIndex(i => i.id === itemId);
                if (itemIndex > -1) {
                    const deletedName = cartItems[itemIndex].title;
                    cartItems.splice(itemIndex, 1);
                    const cardEl = document.querySelector(`[data-item-id="${itemId}"]`);
                    if (cardEl) {
                        cardEl.style.transition = 'all 0.3s ease';
                        cardEl.style.opacity = '0';
                        cardEl.style.transform = 'scale(0.95)';
                        setTimeout(() => cardEl.remove(), 250);
                    }
                    setTimeout(() => recalculateCart(), 260);
                    showToast('Đã xóa', `Đã loại bỏ "${deletedName}" khỏi giỏ hàng.`);
                }
            }

            closeDeleteConfirmModal();
        }

        function deleteSingleItem(itemId) {
            openDeleteConfirmModal(itemId);
        }

        function deleteSelectedItems() {
            openDeleteConfirmModal('selected');
        }

        // --- 5. SHELF HORIZONTAL SCROLL HELPER (CHUẨN TC.HTML) ---
        function scrollShelf(shelfId, direction) {
            const el = document.getElementById(shelfId);
            if (!el) return;
            const firstCard = el.querySelector('[data-book-id]');
            const cardWidth = firstCard ? (firstCard.offsetWidth + 20) : 220;
            el.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' });
        }

        // --- 6. ADD RECOMMENDED BOOK TO CART ---
        function addRecommendedBook(recId, title, author, cover, price, category, rentalDays = 7, planKey = '7') {
            // Check if already in cart
            const existing = cartItems.find(i => i.title === title);
            if (existing) {
                showToast('Thông báo', `"${title}" đã có sẵn trong giỏ hàng của bạn.`);
                return;
            }

            const newId = `book-rec-${Date.now()}`;
            const newItem = {
                id: newId,
                title: title,
                author: author,
                category: category,
                cover: cover,
                days: rentalDays,
                planKey: planKey,
                price: price,
                selected: true
            };
            cartItems.push(newItem);

            // Append card to DOM
            const container = document.getElementById('cart-items-container');
            if (container) {
                const cardHTML = `
                    <div class="cart-item-card p-4 sm:p-5 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-md transition-all relative group animate-fadeIn" data-item-id="${newId}" data-price="${price}" data-duration="${rentalDays}">
                        <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                            <div class="flex items-center pt-1 sm:pt-0 shrink-0">
                                <input type="checkbox" checked onchange="handleItemCheckboxChange('${newId}')" class="luxury-checkbox item-checkbox" data-target="${newId}">
                            </div>
                            <div class="relative w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden border border-paper-border dark:border-night-border shrink-0 shadow-md bg-night-card cart-book-cover">
                                <img src="${cover || '/logo.png'}" alt="${title}" class="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" onerror="this.onerror=null;this.src='/logo.png'">
                                <span class="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-white text-[9px] font-metadata font-bold uppercase">
                                    ${category}
                                </span>
                            </div>
                            <div class="flex-1 min-w-0 space-y-2">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-[11px] font-metadata font-bold text-wine dark:text-gold uppercase tracking-wider">HALM Edition</span>
                                        <span class="text-xs text-ink-muted dark:text-night-muted">•</span>
                                        <span class="text-[11px] font-metadata text-ink-muted dark:text-night-muted">Bản quyền số</span>
                                    </div>
                                    <h3 class="font-display font-black text-base sm:text-lg text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors truncate">
                                        ${title}
                                    </h3>
                                    <p class="font-editorial text-xs text-ink-muted dark:text-night-muted">
                                        Tác giả: <span class="font-semibold text-ink dark:text-night-text">${author}</span>
                                    </p>
                                </div>
                                <div class="flex flex-wrap items-center gap-2.5 pt-1">
                                    <span class="text-xs font-metadata font-bold text-ink-muted dark:text-night-muted flex items-center gap-1">
                                        <i class="ph-bold ph-calendar text-sm text-wine dark:text-gold"></i> Thời hạn thuê:
                                    </span>
                                    <div class="relative">
                                        <select onchange="updateItemDuration('${newId}', this.value)" class="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-metadata font-bold bg-paper-200/80 dark:bg-night-surface border border-paper-border dark:border-night-border text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold cursor-pointer transition-colors shadow-sm">
                                            <option value="1|${Math.round(price * 0.4)}" ${rentalDays === 1 ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">1 ngày (${Math.round(price * 0.4)} Khoai)</option>
                                            <option value="3|${Math.round(price * 0.7)}" ${rentalDays === 3 ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">3 ngày (${Math.round(price * 0.7)} Khoai)</option>
                                            <option value="7|${price}" ${rentalDays === 7 ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">7 ngày (${price} Khoai - Tiêu chuẩn)</option>
                                            <option value="15|${Math.round(price * 1.8)}" class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">15 ngày (${Math.round(price * 1.8)} Khoai)</option>
                                            <option value="30|${Math.round(price * 2.8)}" class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">30 ngày (${Math.round(price * 2.8)} Khoai)</option>
                                        </select>
                                        <i class="ph-bold ph-caret-down text-xs text-ink-muted dark:text-night-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                                    </div>
                                </div>
                            </div>
                            <div class="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-paper-border dark:border-night-border shrink-0">
                                <div class="text-left sm:text-right">
                                    <div class="font-display font-black text-lg sm:text-xl text-wine dark:text-gold flex items-center sm:justify-end gap-1">
                                        <span id="price-${newId}">${price}</span>
                                        <span class="text-xs font-metadata font-extrabold uppercase text-gold">Khoai <i class="ph-fill ph-coins"></i></span>
                                    </div>
                                    <div class="text-[10px] font-metadata text-ink-muted dark:text-night-muted">Gia hạn tự động: Tắt</div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button type="button" onclick="openBookPreview('generic')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-xs font-metadata font-bold text-ink dark:text-night-text transition-colors">
                                        <i class="ph-bold ph-book-open text-xs"></i> <span>Đọc thử</span>
                                    </button>
                                    <button type="button" onclick="deleteSingleItem('${newId}')" class="p-1.5 rounded-lg border border-paper-border dark:border-night-border hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors">
                                        <i class="ph-bold ph-trash text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', cardHTML);
                const scrollWrapper = document.getElementById('cart-items-scroll-wrapper');
                if (scrollWrapper) {
                    scrollWrapper.scrollTo({ top: scrollWrapper.scrollHeight, behavior: 'smooth' });
                }
            }

            recalculateCart();
            showToast('Đã thêm thành công', `Đã thêm "${title}" vào giỏ hàng.`);
        }

        // --- 7. COUPON SYSTEM ---
        function applyCoupon() {
            const input = document.getElementById('coupon-input');
            const code = input ? input.value.trim().toUpperCase() : '';

            if (!code) {
                showToast('Lỗi mã ưu đãi', 'Vui lòng nhập mã giảm giá.');
                return;
            }

            if (code === 'HALM2026' || code === 'VIPBOOK' || code === 'KHOAI5') {
                appliedCouponDiscount = 5;
                appliedCouponName = code;
                const badge = document.getElementById('coupon-active-badge');
                const nameText = document.getElementById('coupon-name-text');
                if (badge) badge.classList.remove('hidden');
                if (nameText) nameText.textContent = code;
                if (input) input.value = '';
                recalculateCart();
                showToast('Áp dụng thành công', `Mã ${code} đã được áp dụng (-5 Khoai).`);
            } else if (code === 'HALMVIP10') {
                appliedCouponDiscount = 10;
                appliedCouponName = code;
                const badge = document.getElementById('coupon-active-badge');
                const nameText = document.getElementById('coupon-name-text');
                if (badge) badge.classList.remove('hidden');
                if (nameText) nameText.textContent = code;
                if (input) input.value = '';
                recalculateCart();
                showToast('Áp dụng thành công', `Mã siêu đặc quyền ${code} đã được áp dụng (-10 Khoai).`);
            } else {
                showToast('Mã không hợp lệ', 'Mã ưu đãi không chính xác hoặc đã hết hạn.');
            }
        }

        function removeCoupon() {
            appliedCouponDiscount = 0;
            appliedCouponName = '';
            const badge = document.getElementById('coupon-active-badge');
            if (badge) badge.classList.add('hidden');
            recalculateCart();
            showToast('Đã hủy ưu đãi', 'Đã gỡ bỏ mã giảm giá.');
        }

        // --- 8. CHECKOUT PROCESS ---
        function handleCheckoutProcess() {
            const selectedItems = cartItems.filter(i => i.selected);
            if (selectedItems.length === 0) {
                showToast('Thông báo', 'Vui lòng chọn ít nhất 1 tác phẩm để thuê.');
                return;
            }

            const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
            const discount = (subtotal > 0 && appliedCouponDiscount > 0) ? Math.min(appliedCouponDiscount, subtotal) : 0;
            const total = Math.max(0, subtotal - discount);

            if (userWalletBalance < total) {
                showToast('Số dư không đủ', 'Số dư ví Khoai không đủ để thực hiện thanh toán.');
                return;
            }

            // Deduct from balance
            userWalletBalance -= total;

            // Generate Random Transaction ID
            const txId = 'HLM-' + Math.floor(100000 + Math.random() * 900000);

            // Update modal DOM
            const paidEl = document.getElementById('checkout-receipt-paid');
            if (paidEl) paidEl.textContent = `${total} Khoai`;

            const txCodeEl = document.getElementById('checkout-tx-code');
            if (txCodeEl) txCodeEl.textContent = txId;

            const finalBalanceEl = document.getElementById('checkout-final-balance');
            if (finalBalanceEl) finalBalanceEl.textContent = `${userWalletBalance.toLocaleString()} Khoai`;

            // Open Checkout Modal
            const modal = document.getElementById('checkout-modal');
            const dialog = document.getElementById('checkout-modal-dialog');
            if (modal && dialog) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                dialog.classList.remove('scale-95');
                dialog.classList.add('scale-100');
            }

            // Remove selected items from cart
            cartItems = cartItems.filter(i => !i.selected);
            document.querySelectorAll('.cart-item-card').forEach(card => {
                const targetId = card.getAttribute('data-item-id');
                const stillExists = cartItems.some(i => i.id === targetId);
                if (!stillExists) card.remove();
            });

            recalculateCart();
            showToast('Thành công', 'Đã thuê sách thành công. Vui lòng kiểm tra Tủ Sách Cá Nhân.');
        }

        function closeCheckoutModal() {
            const modal = document.getElementById('checkout-modal');
            const dialog = document.getElementById('checkout-modal-dialog');
            if (modal && dialog) {
                modal.classList.add('opacity-0', 'pointer-events-none');
                dialog.classList.remove('scale-100');
                dialog.classList.add('scale-95');
            }
        }

        // --- 9. BOOK READER PREVIEW MODAL ---
        const previewDatabase = {
            'meo-ben-cua-so': {
                title: 'Có Hai Con Mèo Ngồi Bên Cửa Sổ',
                author: 'Nguyễn Nhật Ánh • NXB Trẻ',
                content: `
                    <p class="font-display font-semibold text-ink dark:text-night-text text-sm">Chương 1: Nỗi buồn của thi sĩ lông vàng</p>
                    <p>Chuột gấu là một con chuột béo tròn như cái củ khoai tây, nhưng nó không sợ mèo. Bởi vì con mèo ngồi bên cửa sổ kia chẳng buồn bắt chuột. Nó là Gấu - con mèo thi sĩ biết làm thơ tình.</p>
                    <p>Gấu ngồi đó nhìn những giọt nắng lung linh rớt qua kẽ lá me, đôi tai vểnh lên nghe tiếng lá thở trong vườn chiều. Trong ký ức êm đềm của nó, nàng mèo Áo Hoa vẫn là đóa hoa rực rỡ nhất trần đời...</p>
                    <p><em>"Tình yêu không phân biệt giống loài, tình yêu biến một kẻ săn mồi trở thành nhà thơ..."</em></p>
                `
            },
            'ho-so-mat': {
                title: 'Hồ Sơ Mật – Phản Gián: Cuộc Đấu Trí Thầm Lặng',
                author: 'Nhiều tác giả • NXB Chính Trị Quốc Gia',
                content: `
                    <p class="font-display font-semibold text-ink dark:text-night-text text-sm">Lời mở đầu: Những chiến sĩ vô danh</p>
                    <p>Hồ sơ lưu trữ mang mật hiệu K-75 vừa được giải mật sau hơn bốn thập kỷ. Từng trang giấy ố vàng chứa đựng những bản mật mã điện báo và sơ đồ tác chiến nghẹt thở giữa lòng đô thành Sài Gòn trước năm 1975.</p>
                    <p>Trong bóng tối của những căn nhà bí mật, cuộc chiến phản gián không có tiếng súng nổ rền vang, nhưng mỗi quyết định đều là ranh giới giữa sự sống còn của cả mạng lưới tình báo cách mạng...</p>
                    <p>Cuốn sách khắc họa chân dung chân thực của những chiến sĩ trinh sát đã hy sinh cả thanh xuân và tên tuổi vì sự bình yên của Tổ quốc.</p>
                `
            },
            'generic': {
                title: 'Đọc Thử Tác Phẩm',
                author: 'Bản quyền số HALM BOOK',
                content: `
                    <p class="font-display font-semibold text-ink dark:text-night-text text-sm">Trích đoạn xem trước</p>
                    <p>Cảm ơn bạn đã quan tâm đến tác phẩm này. Hệ thống đọc sách HALM BOOK cho phép bạn trải nghiệm trích đoạn nguyên bản với chất lượng dàn trang chuẩn học thuật.</p>
                    <p>Hãy hoàn tất thủ tục thuê sách để mở khóa toàn bộ nội dung, tính năng ghi chú thông minh và đồng bộ hóa đa thiết bị.</p>
                `
            }
        };

        function openBookPreview(key) {
            const data = previewDatabase[key] || previewDatabase['generic'];
            const titleEl = document.getElementById('preview-modal-title');
            const authorEl = document.getElementById('preview-modal-author');
            const contentEl = document.getElementById('preview-modal-content');
            const modal = document.getElementById('preview-modal');
            const dialog = document.getElementById('preview-modal-dialog');

            if (titleEl) titleEl.textContent = data.title;
            if (authorEl) authorEl.textContent = data.author;
            if (contentEl) contentEl.innerHTML = data.content;

            if (modal && dialog) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                dialog.classList.remove('scale-95');
                dialog.classList.add('scale-100');
            }
        }

        function closeBookPreview() {
            const modal = document.getElementById('preview-modal');
            const dialog = document.getElementById('preview-modal-dialog');
            if (modal && dialog) {
                modal.classList.add('opacity-0', 'pointer-events-none');
                dialog.classList.remove('scale-100');
                dialog.classList.add('scale-95');
            }
        }

        // --- 10. TOAST NOTIFICATION UTILITY ---
        function showToast(title, message) {
            const toast = document.getElementById('toast-notification');
            const toastTitle = document.getElementById('toast-title');
            const toastMsg = document.getElementById('toast-message');
            if (!toast) return;

            toastTitle.textContent = title;
            toastMsg.textContent = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        }

        // --- 11. CHATBOT WIDGET ---
        function toggleChatbot() {
            const win = document.getElementById('chat-window');
            if (win) win.classList.toggle('open');
        }

        function openChatbot(initialMsg) {
            const win = document.getElementById('chat-window');
            if (win) {
                win.classList.add('open');
                if (initialMsg) {
                    appendChatMessage('user', initialMsg);
                    setTimeout(() => {
                        appendChatMessage('bot', 'Chào bạn! Hệ thống thanh toán sách bằng Khoai của HALM BOOK hỗ trợ thuê linh hoạt từ 1 đến 30 ngày. Số dư Khoai của bạn sẽ được trừ tự động sau khi xác nhận.');
                    }, 600);
                }
            }
        }

        function sendChatMessage() {
            const input = document.getElementById('chat-input');
            const text = input ? input.value.trim() : '';
            if (!text) return;

            appendChatMessage('user', text);
            input.value = '';

            setTimeout(() => {
                let reply = 'Cảm ơn câu hỏi của bạn. Bạn có thể sử dụng mã ưu đãi "HALM2026" để được giảm ngay 5 Khoai cho đơn thuê hôm nay!';
                if (text.toLowerCase().includes('khoai') || text.toLowerCase().includes('nạp')) {
                    reply = 'Bạn có thể nạp thêm Khoai tại mục "Hồ Sơ" hoặc nâng cấp gói Hội Viên để được cộng 1,000 Khoai miễn phí mỗi tháng!';
                } else if (text.toLowerCase().includes('bookmark') || text.toLowerCase().includes('quà')) {
                    reply = 'Chương trình tặng Bookmark mạ vàng độc quyền HALM áp dụng khi tổng giá trị đơn thuê đạt từ 30 Khoai trở lên bạn nhé!';
                }
                appendChatMessage('bot', reply);
            }, 700);
        }

        function appendChatMessage(sender, text) {
            const container = document.getElementById('chat-messages-container');
            if (!container) return;

            const isUser = sender === 'user';
            const msgHTML = `
                <div class="flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}">
                    <div class="w-6 h-6 rounded-full ${isUser ? 'bg-wine text-white' : 'bg-gold/20 text-gold'} flex items-center justify-center shrink-0 text-xs">
                        <i class="ph-bold ${isUser ? 'ph-user' : 'ph-sparkle'}"></i>
                    </div>
                    <div class="p-3 rounded-2xl ${isUser ? 'rounded-tr-sm bg-wine text-white' : 'rounded-tl-sm bg-paper-200 dark:bg-night-surface text-ink dark:text-night-text'} leading-relaxed max-w-[80%]">
                        ${text}
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', msgHTML);
            container.scrollTop = container.scrollHeight;
        }

        // --- 12. SCROLL & THEME SETUP ---
        // Header blur on scroll & Scroll To Top Button
        const navbar = document.getElementById('navbar');
        const btnScrollToTop = document.getElementById('btnScrollToTop');

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            if (scrollY > 30) {
                navbar?.classList.add('glass-nav', 'shadow-sm');
                navbar?.classList.remove('border-transparent');
            } else {
                navbar?.classList.remove('glass-nav', 'shadow-sm');
                navbar?.classList.add('border-transparent');
            }

            if (btnScrollToTop) {
                if (scrollY > 350) {
                    btnScrollToTop.classList.add('visible');
                } else {
                    btnScrollToTop.classList.remove('visible');
                }
            }
        });

        if (btnScrollToTop) {
            btnScrollToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Dynamic synchronization of Cart Toolbar Width with Book Card Width
        function syncCartToolbarWidth() {
            const toolbar = document.getElementById('cart-toolbar');
            const scrollWrapper = document.getElementById('cart-items-scroll-wrapper');
            if (!toolbar || !scrollWrapper) return;
            const card = scrollWrapper.querySelector('.cart-item-card');
            if (card) {
                toolbar.style.width = card.offsetWidth + 'px';
            } else {
                const scrollbarW = Math.max(0, scrollWrapper.offsetWidth - scrollWrapper.clientWidth) || 10;
                toolbar.style.width = `calc(100% - ${scrollbarW}px)`;
            }
        }

        if (window.ResizeObserver) {
            const scrollWrapper = document.getElementById('cart-items-scroll-wrapper');
            if (scrollWrapper) {
                new ResizeObserver(() => syncCartToolbarWidth()).observe(scrollWrapper);
            }
        }
        window.addEventListener('resize', syncCartToolbarWidth);
        syncCartToolbarWidth();

        const cartScrollWrapper = document.getElementById('cart-items-scroll-wrapper');
        const toolbar = document.getElementById('cart-toolbar');
        if (cartScrollWrapper) {
            cartScrollWrapper.addEventListener('wheel', (e) => {
                if (Math.abs(e.deltaY) === 0) return;

                const delta = e.deltaY;
                const tbRect = toolbar ? toolbar.getBoundingClientRect() : { bottom: 0 };
                const wrapRect = cartScrollWrapper.getBoundingClientRect();
                const currentScroll = cartScrollWrapper.scrollTop;
                const maxScroll = Math.max(0, cartScrollWrapper.scrollHeight - cartScrollWrapper.clientHeight);

                if (delta > 0) { // === CUỘN XUỐNG ===
                    // 1. Phía trên: nếu toolbar chưa cuộn qua navbar -> cuộn trang chính xuống
                    if (tbRect.bottom > 85) {
                        window.scrollBy({ top: delta, behavior: 'instant' });
                        e.preventDefault();
                        return;
                    }

                    // 2. Tại vị trí đọc giỏ hàng: ưu tiên cuộn danh sách sách bên trong
                    if (currentScroll < maxScroll - 1) {
                        cartScrollWrapper.scrollTop = Math.min(maxScroll, currentScroll + delta);
                        e.preventDefault();
                        return;
                    }

                    // 3. Danh sách đã chạm đáy: cuộn tiếp trang chính xuống danh mục bên dưới
                    window.scrollBy({ top: delta, behavior: 'instant' });
                    e.preventDefault();

                } else if (delta < 0) { // === CUỘN LÊN ===
                    // 1. Phía dưới: nếu top của giỏ hàng bị đẩy qua navbar (đang ở dưới cùng) -> cuộn trang chính lên trước!
                    if (wrapRect.top < 65) {
                        window.scrollBy({ top: delta, behavior: 'instant' });
                        e.preventDefault();
                        return;
                    }

                    // 2. Tại vị trí đọc giỏ hàng: ưu tiên cuộn danh sách sách lên cho đến khi về đầu
                    if (currentScroll > 1) {
                        cartScrollWrapper.scrollTop = Math.max(0, currentScroll + delta);
                        e.preventDefault();
                        return;
                    }

                    // 3. Danh sách đã về đầu: cuộn tiếp trang chính lên hiển thị toolbar & header
                    window.scrollBy({ top: delta, behavior: 'instant' });
                    e.preventDefault();
                }
            }, { passive: false });
        }

        // Mobile Drawer toggle
        const mobileBtn = document.getElementById('mobile-menu-btn');
        const mobileDrawer = document.getElementById('mobile-drawer');
        if (mobileBtn && mobileDrawer) {
            mobileBtn.addEventListener('click', () => {
                mobileDrawer.classList.toggle('hidden');
            });
        }

        // Search trigger
        function handleHeaderSearch() {
            const query = document.getElementById('header-search-input')?.value.trim();
            if (query) {
                showToast('Tìm kiếm', `Đang tìm kiếm sách: "${query}"...`);
            }
        }

        // Theme Toggle with LocalStorage & Starry background
        const themeToggleBtn = document.getElementById('theme-toggle');
        const themeIcon = document.getElementById('theme-icon');

        function initTheme() {
            const savedTheme = localStorage.getItem('halm_theme');
            const isDark = savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
            if (isDark) {
                document.documentElement.classList.add('dark');
                if (themeIcon) {
                    themeIcon.classList.remove('ph-moon');
                    themeIcon.classList.add('ph-sun');
                }
            } else {
                document.documentElement.classList.remove('dark');
                if (themeIcon) {
                    themeIcon.classList.remove('ph-sun');
                    themeIcon.classList.add('ph-moon');
                }
            }
            createStarrySky();
        }

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.setItem('halm_theme', isDark ? 'dark' : 'light');
                if (themeIcon) {
                    if (isDark) {
                        themeIcon.classList.remove('ph-moon');
                        themeIcon.classList.add('ph-sun');
                    } else {
                        themeIcon.classList.remove('ph-sun');
                        themeIcon.classList.add('ph-moon');
                    }
                }
                showToast('Chế độ hiển thị', isDark ? 'Đã kích hoạt Giao diện Tối (Night Sky).' : 'Đã chuyển về Giao diện Sáng (Paper Modern).');
            });
        }

        function createStarrySky() {
            const container = document.getElementById('starry-background');
            if (!container) return;
            container.innerHTML = '';
            const starCount = 65;
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star';
                const size = Math.random() * 2 + 1;
                star.style.width = `${size}px`;
                star.style.height = `${size}px`;
                star.style.top = `${Math.random() * 100}%`;
                star.style.left = `${Math.random() * 100}%`;
                star.style.setProperty('--duration', `${Math.random() * 3 + 2}s`);
                container.appendChild(star);
            }
        }

        // Global listeners for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDeleteConfirmModal();
                closeCheckoutModal();
                closeBookPreview();
            }
        });

        async function loadCartFromServer() {
            try {
                const response = await axiosInstance.get('/api/home/cart/items');
                const items = Array.isArray(response.data) ? response.data : [];
                cartItems = [];
                const container = document.getElementById('cart-items-container');
                if (container) container.innerHTML = '';

                items.forEach((item) => {
                    addRecommendedBook(
                        item.cartItemId || item.bookId,
                        item.bookName || item.title || 'Sách',
                        item.author || 'Đang cập nhật',
                        item.imgUrl || item.cover || '/logo.png',
                        item.selectedPrice ?? item.rentPrice ?? item.price ?? 0,
                        item.category || 'Sách',
                        item.rentalDays ?? (item.planKey === 'forever' ? 99999 : Number(item.planKey) || 7),
                        item.planKey || '7'
                    );
                });
                recalculateCart();
            } catch (error) {
                console.error('Không thể tải giỏ hàng từ máy chủ:', error);
                cartItems = [];
                recalculateCart();
            }
        }

        // Initialize on load
        const initializeCart = () => {
            initTheme();
            recalculateCart();
            loadCartFromServer();
            const badge = document.getElementById('coupon-active-badge');
            if (badge) badge.classList.remove('hidden');

            document.getElementById('delete-confirm-modal')?.addEventListener('click', function(e) {
                if (e.target === this) closeDeleteConfirmModal();
            });
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeCart, { once: true });
        } else {
            initializeCart();
        }
        window.recalculateCart = recalculateCart;
        window.toggleSelectAll = toggleSelectAll;
        window.handleItemCheckboxChange = handleItemCheckboxChange;
        window.updateItemDuration = updateItemDuration;
        window.openDeleteConfirmModal = openDeleteConfirmModal;
        window.closeDeleteConfirmModal = closeDeleteConfirmModal;
        window.confirmDeleteExecution = confirmDeleteExecution;
        window.deleteSingleItem = deleteSingleItem;
        window.deleteSelectedItems = deleteSelectedItems;
        window.scrollShelf = scrollShelf;
        window.addRecommendedBook = addRecommendedBook;
        window.applyCoupon = applyCoupon;
        window.removeCoupon = removeCoupon;
        window.handleCheckoutProcess = handleCheckoutProcess;
        window.closeCheckoutModal = closeCheckoutModal;
        window.openBookPreview = openBookPreview;
        window.closeBookPreview = closeBookPreview;
        window.showToast = showToast;
        window.toggleChatbot = toggleChatbot;
        window.openChatbot = openChatbot;
        window.sendChatMessage = sendChatMessage;
        window.appendChatMessage = appendChatMessage;
        window.syncCartToolbarWidth = syncCartToolbarWidth;
        window.handleHeaderSearch = handleHeaderSearch;
        window.initTheme = initTheme;
        window.createStarrySky = createStarrySky;
    }, []);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: cartStyles }} />
            <style dangerouslySetInnerHTML={{ __html: cartThemeStyles }} />
            <style>{`
                #trending-cart-shelf {
                    padding-top: 0.85rem;
                }
                #trending-cart-shelf > div {
                    position: relative;
                    z-index: 1;
                }
                #trending-cart-shelf > div:hover {
                    z-index: 2;
                }
            `}</style>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
            <UserLayout
                className="font-sans"
                onOpenChatbot={(message) => window.openChatbot?.(message)}
            >
            <div className="paper-grain relative min-h-screen flex flex-col">
                {/* Starry background in Dark Mode */}
                    <div id="starry-background"></div>
                
                    {/* Toast Notification */}
                    <div id="toast-notification" className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-paper-surface dark:bg-night-card border border-wine/30 dark:border-gold/40 shadow-2xl text-ink dark:text-night-text">
                        <div className="w-8 h-8 rounded-full bg-wine/10 dark:bg-gold/20 flex items-center justify-center text-wine dark:text-gold shrink-0">
                            <i className="ph-bold ph-check text-base"></i>
                        </div>
                        <div>
                            <div className="font-display font-bold text-xs" id="toast-title">Giỏ Hàng HALM BOOK</div>
                            <div className="font-editorial text-xs text-ink-muted dark:text-night-muted" id="toast-message">Đã cập nhật giỏ hàng thành công.</div>
                        </div>
                    </div>
                
                    {/* ========================================================
                         NAVBAR: EDITORIAL NAVIGATION (ĐỒNG BỘ 1520PX VỚI TRANG CHỦ)
                         ======================================================== */}
                    {false && (<header id="navbar" className="fixed top-0 inset-x-0 z-40 transition-all duration-300 py-4 border-b border-transparent">
                        <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                            
                            {/* Logo & Brand */}
                            <a href="testhome/tc.html" className="flex items-center gap-3 group shrink-0" aria-label="HALM BOOK Homepage">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-wine flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src='/logo.png' }} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-ink dark:text-night-text leading-tight group-hover:text-wine dark:group-hover:text-gold transition-colors">
                                        HALM BOOK
                                    </span>
                                    <span className="font-metadata text-[9px] uppercase tracking-[0.22em] font-bold text-ink-muted dark:text-night-muted -mt-0.5">
                                        Reading Ecosystem & Library
                                    </span>
                                </div>
                            </a>
                
                            {/* Navigation Links */}
                            <nav className="hidden lg:flex items-center gap-7 text-xs font-bold tracking-wider uppercase text-ink/80 dark:text-night-muted" aria-label="Main Navigation">
                                <a href="testhome/tc.html" className="hover:text-wine dark:hover:text-gold transition-colors">Trang Chủ</a>
                                <a href="offers.html" className="hover:text-wine dark:hover:text-gold transition-colors">Ưu Đãi</a>
                                <a href="tiers.html" className="hover:text-wine dark:hover:text-gold transition-colors">Gói Hội Viên</a>
                                <a href="my-books.html" className="hover:text-wine dark:hover:text-gold transition-colors">Tủ Sách</a>
                                <a href="news.html" className="hover:text-wine dark:hover:text-gold transition-colors">Tin Tức</a>
                                <button type="button" onClick={() => { window.openChatbot('Chào bạn! Tôi muốn hỏi về chính sách thuê sách và tích lũy Khoai.') }} className="text-wine dark:text-gold flex items-center gap-1 font-black cursor-pointer hover:opacity-80 transition-opacity">
                                    <i className="ph-bold ph-sparkle text-sm"></i> Trợ Lý AI
                                </button>
                            </nav>
                
                            {/* Search Bar */}
                            <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative">
                                <form id="search-form" className="w-full relative flex items-center" onSubmit={(event) => { event.preventDefault(); window.handleHeaderSearch() }}>
                                    <i className="ph ph-magnifying-glass absolute left-3.5 text-ink-muted text-sm"></i>
                                    <input type="text" id="header-search-input" placeholder="Tìm sách, tác giả, gói thuê..." 
                                           className="w-full pl-9 pr-8 py-2 rounded-full text-xs font-medium bg-paper-200/70 dark:bg-night-card border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold text-ink dark:text-night-text placeholder-ink-muted/80 transition-all shadow-inner"
                                           autoComplete="off" />
                                </form>
                            </div>
                
                            {/* Utilities: Potato Balance, Cart, Account, Theme Toggle, Mobile Menu */}
                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                {/* User Potato Balance */}
                                <a href="profile.html" className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm text-xs font-metadata font-bold text-ink dark:text-night-text hover:border-gold transition-colors" title="Số dư Khoai thưởng của bạn">
                                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse"></span>
                                    <span id="user-khoai-nav">1,250</span>
                                    <span className="text-gold font-extrabold flex items-center gap-0.5">Khoai <i className="ph-fill ph-coins text-[11px]"></i></span>
                                </a>
                
                                {/* Cart Icon Button (Active Highlight) */}
                                <a href="cart.html" className="p-2.5 rounded-full bg-wine/10 dark:bg-gold/15 text-wine dark:text-gold border border-wine/25 dark:border-gold/30 transition-colors relative" title="Giỏ hàng hiện tại">
                                    <i className="ph-fill ph-shopping-bag text-xl"></i>
                                    <span id="header-cart-badge" className="font-metadata absolute top-1 right-1 w-4 h-4 bg-wine dark:bg-gold text-white dark:text-night-bg text-[10px] font-bold rounded-full flex items-center justify-center">2</span>
                                </a>
                
                                {/* Account Link */}
                                <a href="profile.html" className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card border border-paper-border dark:border-night-border transition-colors">
                                    <i className="ph-bold ph-user text-xs"></i>
                                    <span className="hidden sm:inline">Hồ Sơ</span>
                                </a>
                
                                {/* Theme Toggle */}
                                <button id="theme-toggle" className="p-2.5 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card transition-colors" title="Đổi giao diện Sáng / Tối" aria-label="Đổi giao diện Sáng / Tối">
                                    <i id="theme-icon" className="ph-bold ph-moon text-xl"></i>
                                </button>
                
                                {/* Mobile Menu Button */}
                                <button id="mobile-menu-btn" className="lg:hidden p-2.5 rounded-full text-ink dark:text-night-text hover:bg-paper-200 dark:hover:bg-night-card" aria-label="Mở Menu">
                                    <i className="ph-bold ph-list text-2xl"></i>
                                </button>
                            </div>
                        </div>
                
                        {/* Mobile Drawer */}
                        <div id="mobile-drawer" className="hidden lg:hidden px-6 py-5 bg-paper-surface dark:bg-night-surface border-b border-paper-border dark:border-night-border space-y-3">
                            <div className="flex items-center justify-between pb-3 border-b border-paper-border dark:border-night-border">
                                <span className="text-xs font-metadata text-ink-muted dark:text-night-muted">Số dư khoai:</span>
                                <span className="text-xs font-metadata font-bold text-gold flex items-center gap-1">1,250 Khoai <i className="ph-fill ph-coins"></i></span>
                            </div>
                            <nav className="flex flex-col gap-2 font-bold text-xs uppercase tracking-wider">
                                <a href="testhome/tc.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Trang Chủ</a>
                                <a href="offers.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Ưu Đãi Đặc Quyền</a>
                                <a href="tiers.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Gói Hội Viên</a>
                                <a href="my-books.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Tủ Sách</a>
                                <a href="news.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Tin Tức & Sự Kiện</a>
                                <a href="cart.html" className="py-1.5 text-wine dark:text-gold">Giỏ Hàng</a>
                                <a href="profile.html" className="py-1.5 text-ink dark:text-night-text hover:text-wine">Thông Tin Cá Nhân</a>
                                <a href="login.html" className="py-1.5 text-rose-600 dark:text-rose-400">Đăng Xuất</a>
                            </nav>
                        </div>
                    </header>)}
                
                
                    {/* ========================================================
                         MAIN CONTENT: TIÊU CHUẨN MAX-W 1520PX, ĐỒNG BỘ FONT INTER
                         ======================================================== */}
                    <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1">
                
                        {/* Top Breadcrumb & Page Intro */}
                        <div className="mb-6 sm:mb-8 border-b border-paper-border dark:border-night-border pb-5">
                            {/* Breadcrumbs */}
                            <nav className="flex items-center gap-2 text-xs font-metadata text-ink-muted dark:text-night-muted mb-2">
                                <a href="testhome/tc.html" className="hover:text-wine dark:hover:text-gold transition-colors">Trang Chủ</a>
                                <span>/</span>
                                <span className="text-ink dark:text-night-text font-bold">Giỏ Hàng & Thuê Sách</span>
                            </nav>
                
                            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-ink dark:text-night-text tracking-tight">
                                Giỏ Hàng Thuê Sách
                            </h1>
                        </div>
                
                
                        {/* ========================================================
                             CART MAIN LAYOUT: TWO-COLUMN ALIGNED AT BOOK 1
                             - Left Column (7 cols): Toolbar (row 1) + Scrollable Cart Items (row 2)
                             - Right Column (5 cols): Checkout Summary Card (row 2, starts level with Book 1)
                             ======================================================== */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-4 items-start mb-12">
                
                            {/* 1. Cột trái hàng 1: Thanh công cụ riêng (Chọn tất cả + Xóa mục đã chọn) */}
                            <div className="lg:col-span-7">
                                <div id="cart-toolbar" className="p-3.5 sm:p-4 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-center justify-between gap-3">
                                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                        <input type="checkbox" id="check-all" defaultChecked onChange={(event) => { window.toggleSelectAll(event.currentTarget.checked) }} className="luxury-checkbox" />
                                        <span className="font-display font-bold text-xs sm:text-sm text-ink dark:text-night-text whitespace-nowrap">
                                            Chọn tất cả (<span id="select-all-count">2</span>)
                                        </span>
                                    </label>
                
                                    <button type="button" onClick={() => { window.deleteSelectedItems() }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-metadata font-bold transition-colors cursor-pointer">
                                        <i className="ph-bold ph-trash text-sm"></i>
                                        <span>Xóa mục đã chọn</span>
                                    </button>
                                </div>
                            </div>
                
                            {/* 2. Cột phải hàng 1: Thẻ div riêng hiển thị số dư ví Khoai (Nằm trên thẻ thanh toán) */}
                            <div className="lg:col-span-5">
                                <div id="cart-balance-card" className="p-3.5 sm:p-4 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center text-sm shrink-0">
                                            <i className="ph-fill ph-wallet"></i>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-metadata uppercase tracking-wider font-bold text-ink-muted dark:text-night-muted">Số dư ví Khoai</div>
                                            <div className="font-metadata font-bold text-xs text-ink dark:text-night-text flex items-center gap-1">
                                                <span id="wallet-balance-display">1,250</span> Khoai
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(Khả dụng)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a href="profile.html" className="px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold text-xs font-metadata font-bold transition-colors flex items-center gap-1">
                                        <span>Nạp thêm</span>
                                        <i className="ph-bold ph-plus text-[10px]"></i>
                                    </a>
                                </div>
                            </div>
                
                            {/* 2. Khung danh sách sách (Hàng 2 bên trái, bắt đầu bằng cuốn sách đầu tiên) */}
                            <div className="lg:col-span-7">
                                {/* Khung cuộn giới hạn chiều cao tối đa (max-h) không làm đẩy nội dung bên dưới */}
                                <div id="cart-items-scroll-wrapper" className="w-full max-h-[604px] pt-0.5 pb-2 overflow-y-auto overflow-x-hidden space-y-4 rounded-2xl">
                                    <div id="cart-items-container" className="space-y-4">
                                    {false && (<>
                                    
                                    {/* Sách 1: Có Hai Con Mèo Ngồi Bên Cửa Sổ */}
                                    <div className="cart-item-card p-4 sm:p-5 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-md transition-all relative group" data-item-id="book-1" data-price="10" data-duration="7">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                                            
                                            {/* Selection Checkbox */}
                                            <div className="flex items-center pt-1 sm:pt-0 shrink-0">
                                                <input type="checkbox" defaultChecked onChange={() => { window.handleItemCheckboxChange('book-1') }} className="luxury-checkbox item-checkbox" data-target="book-1" />
                                            </div>
                
                                            {/* Book Cover Image (Tỷ lệ aspect-[2/3] thanh thoát chuẩn tc.html) */}
                                            <div className="relative w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden border border-paper-border dark:border-night-border shrink-0 shadow-md bg-night-card cart-book-cover">
                                                <img src="https://www.nxbtre.com.vn/Images/Book/nxbtre_full_07292022_022951.jpg" 
                                                     alt="Có Hai Con Mèo Ngồi Bên Cửa Sổ" 
                                                     className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" />
                                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-white text-[9px] font-metadata font-bold uppercase">
                                                     Văn học
                                                </span>
                                            </div>
                
                                            {/* Book Info Details */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[11px] font-metadata font-bold text-wine dark:text-gold uppercase tracking-wider">
                                                            NXB Trẻ
                                                        </span>
                                                        <span className="text-xs text-ink-muted dark:text-night-muted">•</span>
                                                        <span className="text-[11px] font-metadata text-ink-muted dark:text-night-muted">
                                                            Bản quyền số chính thức
                                                        </span>
                                                    </div>
                                                    <h3 className="font-display font-black text-base sm:text-lg text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors truncate">
                                                        Có Hai Con Mèo Ngồi Bên Cửa Sổ
                                                    </h3>
                                                    <p className="font-editorial text-xs text-ink-muted dark:text-night-muted">
                                                        Tác giả: <span className="font-semibold text-ink dark:text-night-text">Nguyễn Nhật Ánh</span>
                                                    </p>
                                                </div>
                
                                                {/* Rental Duration Custom Selector */}
                                                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                                    <span className="text-xs font-metadata font-bold text-ink-muted dark:text-night-muted flex items-center gap-1">
                                                        <i className="ph-bold ph-calendar text-sm text-wine dark:text-gold"></i>
                                                        Thời hạn thuê:
                                                    </span>
                                                    <div className="relative">
                                                        <select onChange={(event) => { window.updateItemDuration('book-1', event.currentTarget.value) }} className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-metadata font-bold bg-paper-200/80 dark:bg-night-surface border border-paper-border dark:border-night-border text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold cursor-pointer transition-colors shadow-sm">
                                                            <option value="1|3" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">1 ngày (3 Khoai)</option>
                                                            <option value="3|6" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">3 ngày (6 Khoai)</option>
                                                            <option value="7|10" selected className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">7 ngày (10 Khoai - Tiêu chuẩn)</option>
                                                            <option value="15|18" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">15 ngày (18 Khoai)</option>
                                                            <option value="30|28" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">30 ngày (28 Khoai - Tiết kiệm)</option>
                                                        </select>
                                                        <i className="ph-bold ph-caret-down text-xs text-ink-muted dark:text-night-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                                                    </div>
                                                </div>
                                            </div>
                
                                            {/* Price & Actions Right Column */}
                                            <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-paper-border dark:border-night-border shrink-0">
                                                <div className="text-left sm:text-right">
                                                    <div className="font-display font-black text-lg sm:text-xl text-wine dark:text-gold flex items-center sm:justify-end gap-1">
                                                        <span id="price-book-1">10</span>
                                                        <span className="text-xs font-metadata font-extrabold uppercase text-gold">Khoai <i className="ph-fill ph-coins"></i></span>
                                                    </div>
                                                    <div className="text-[10px] font-metadata text-ink-muted dark:text-night-muted">
                                                        Gia hạn tự động: Tắt
                                                    </div>
                                                </div>
                
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => { window.openBookPreview('meo-ben-cua-so') }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-xs font-metadata font-bold text-ink dark:text-night-text transition-colors" title="Đọc thử vài chương">
                                                        <i className="ph-bold ph-book-open text-xs"></i>
                                                        <span>Đọc thử</span>
                                                    </button>
                                                    <button type="button" onClick={() => { window.deleteSingleItem('book-1') }} className="p-1.5 rounded-lg border border-paper-border dark:border-night-border hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors" title="Xóa khỏi giỏ hàng">
                                                        <i className="ph-bold ph-trash text-sm"></i>
                                                    </button>
                                                </div>
                                            </div>
                
                                        </div>
                                    </div>
                
                                    {/* Sách 2: Hồ Sơ Mật – Phản Gián */}
                                    <div className="cart-item-card p-4 sm:p-5 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm hover:shadow-md transition-all relative group" data-item-id="book-2" data-price="15" data-duration="3">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                                            
                                            {/* Selection Checkbox */}
                                            <div className="flex items-center pt-1 sm:pt-0 shrink-0">
                                                <input type="checkbox" defaultChecked onChange={() => { window.handleItemCheckboxChange('book-2') }} className="luxury-checkbox item-checkbox" data-target="book-2" />
                                            </div>
                
                                            {/* Book Cover Image (Tỷ lệ aspect-[2/3] thanh thoát) */}
                                            <div className="relative w-20 sm:w-24 aspect-[2/3] rounded-xl overflow-hidden border border-paper-border dark:border-night-border shrink-0 shadow-md bg-night-card cart-book-cover">
                                                <img src="https://bizweb.dktcdn.net/100/197/269/files/ho-so-mat-phan-gian-nhung-cuoc-dau-tri-tham-lang-qua-ngoi-but-nxb-chinh-tri-quoc-gia-su-that.jpg?v=1686733221945" 
                                                     alt="Hồ Sơ Mật – Phản Gián" 
                                                     className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" />
                                                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur text-white text-[9px] font-metadata font-bold uppercase">
                                                    Lịch sử CAND
                                                </span>
                                            </div>
                
                                            {/* Book Info Details */}
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[11px] font-metadata font-bold text-wine dark:text-gold uppercase tracking-wider">
                                                            NXB Chính Trị Quốc Gia Sự Thật
                                                        </span>
                                                        <span className="text-xs text-ink-muted dark:text-night-muted">•</span>
                                                        <span className="text-[11px] font-metadata text-ink-muted dark:text-night-muted">
                                                            Tài liệu chuyên khảo
                                                        </span>
                                                    </div>
                                                    <h3 className="font-display font-black text-base sm:text-lg text-ink dark:text-night-text group-hover:text-wine dark:group-hover:text-gold transition-colors truncate">
                                                        Hồ Sơ Mật – Phản Gián: Cuộc Đấu Trí Thầm Lặng
                                                    </h3>
                                                    <p className="font-editorial text-xs text-ink-muted dark:text-night-muted">
                                                        Tác giả: <span className="font-semibold text-ink dark:text-night-text">Nhiều tác giả</span>
                                                    </p>
                                                </div>
                
                                                {/* Rental Duration Custom Selector */}
                                                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                                    <span className="text-xs font-metadata font-bold text-ink-muted dark:text-night-muted flex items-center gap-1">
                                                        <i className="ph-bold ph-calendar text-sm text-wine dark:text-gold"></i>
                                                        Thời hạn thuê:
                                                    </span>
                                                    <div className="relative">
                                                        <select defaultValue="3|15" onChange={(event) => { window.updateItemDuration('book-2', event.currentTarget.value) }} className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-metadata font-bold bg-paper-200/80 dark:bg-night-surface border border-paper-border dark:border-night-border text-ink dark:text-night-text focus:outline-none focus:border-wine dark:focus:border-gold cursor-pointer transition-colors shadow-sm">
                                                            <option value="1|5" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">1 ngày (5 Khoai)</option>
                                                            <option value="3|15" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">3 ngày (15 Khoai - Đề xuất)</option>
                                                            <option value="7|25" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">7 ngày (25 Khoai)</option>
                                                            <option value="15|45" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">15 ngày (45 Khoai)</option>
                                                            <option value="30|70" className="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">30 ngày (70 Khoai)</option>
                                                        </select>
                                                        <i className="ph-bold ph-caret-down text-xs text-ink-muted dark:text-night-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
                                                    </div>
                                                </div>
                                            </div>
                
                                            {/* Price & Actions Right Column */}
                                            <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-paper-border dark:border-night-border shrink-0">
                                                <div className="text-left sm:text-right">
                                                    <div className="font-display font-black text-lg sm:text-xl text-wine dark:text-gold flex items-center sm:justify-end gap-1">
                                                        <span id="price-book-2">15</span>
                                                        <span className="text-xs font-metadata font-extrabold uppercase text-gold">Khoai <i className="ph-fill ph-coins"></i></span>
                                                    </div>
                                                    <div className="text-[10px] font-metadata text-ink-muted dark:text-night-muted">
                                                        Gia hạn tự động: Tắt
                                                    </div>
                                                </div>
                
                                                <div className="flex items-center gap-2">
                                                    <button type="button" onClick={() => { window.openBookPreview('ho-so-mat') }} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-xs font-metadata font-bold text-ink dark:text-night-text transition-colors" title="Đọc thử vài chương">
                                                        <i className="ph-bold ph-book-open text-xs"></i>
                                                        <span>Đọc thử</span>
                                                    </button>
                                                    <button type="button" onClick={() => { window.deleteSingleItem('book-2') }} className="p-1.5 rounded-lg border border-paper-border dark:border-night-border hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition-colors" title="Xóa khỏi giỏ hàng">
                                                        <i className="ph-bold ph-trash text-sm"></i>
                                                    </button>
                                                </div>
                                            </div>
                
                                        </div>
                                    </div>
                
                                    </>)}
                                    </div>
                                </div>
                
                                {/* 3. Empty State (Hidden when items exist) */}
                                <div id="cart-empty-state" className="hidden py-14 px-6 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-paper-200 dark:bg-night-surface mx-auto flex items-center justify-center text-ink-muted dark:text-night-muted text-3xl">
                                        <i className="ph-bold ph-shopping-bag-open"></i>
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-display font-black text-xl text-ink dark:text-night-text">Giỏ hàng của bạn đang trống</h3>
                                        <p className="font-editorial text-xs text-ink-muted dark:text-night-muted max-w-md mx-auto">
                                            Hiện chưa có tác phẩm nào trong giỏ thuê. Hãy khám phá kho tàng sách phong phú của HALM ngay bên dưới!
                                        </p>
                                    </div>
                                    <a href="testhome/tc.html" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-xs uppercase tracking-wider shadow-md transition-all">
                                        <span>Khám Phá Sách Mới</span>
                                        <i className="ph-bold ph-arrow-right"></i>
                                    </a>
                                </div>
                
                            </div>
                
                
                            {/* ================= RIGHT AREA: 5 COLS (STICKY SUMMARY) ================= */}
                            <div id="cart-summary-sidebar" className="lg:col-span-5 sticky top-24 space-y-5">
                                
                                <div className="rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border p-6 shadow-sm space-y-5">
                                    
                                    {/* Card Header */}
                                    <div className="flex items-center justify-between pb-4 border-b border-paper-border dark:border-night-border">
                                        <div className="flex items-center gap-2.5">
                                            <i className="ph-bold ph-receipt text-lg text-wine dark:text-gold"></i>
                                            <h2 className="font-display font-black text-lg text-ink dark:text-night-text tracking-tight">
                                                Tóm Tắt Đơn Thuê
                                            </h2>
                                        </div>
                                        <span className="text-xs font-metadata text-ink-muted dark:text-night-muted">
                                            <span id="summary-items-count">2</span> sách
                                        </span>
                                    </div>
                
                                    {/* Coupon Code Input Box */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-metadata font-bold text-ink-muted dark:text-night-muted uppercase tracking-wider">
                                            Mã Ưu Đãi / Coupon
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <i className="ph-bold ph-tag absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs"></i>
                                                <input type="text" id="coupon-input" placeholder="VD: HALM2026, VIPBOOK" 
                                                       className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-metadata font-bold uppercase bg-paper-200/70 dark:bg-night-surface border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold text-ink dark:text-night-text placeholder-ink-muted/60 transition-colors" />
                                            </div>
                                            <button type="button" onClick={() => { window.applyCoupon() }} className="px-4 py-2 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-xs font-metadata font-bold text-ink dark:text-night-text transition-all">
                                                Áp Dụng
                                            </button>
                                        </div>
                                        <div id="coupon-active-badge" className="hidden flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-metadata text-emerald-700 dark:text-emerald-300">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <i className="ph-bold ph-seal-check"></i>
                                                <span id="coupon-name-text">HALM2026</span> (-5 Khoai)
                                            </span>
                                            <button type="button" onClick={() => { window.removeCoupon() }} className="text-emerald-600 dark:text-emerald-400 hover:text-rose-500 transition-colors">
                                                <i className="ph-bold ph-x"></i>
                                            </button>
                                        </div>
                                    </div>
                
                                    {/* Gift Progress Meter Box */}
                                    <div className="p-3.5 rounded-xl bg-gold/10 dark:bg-gold/15 border border-gold/30 dark:border-gold/40 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-metadata">
                                            <span className="font-bold text-wine dark:text-gold flex items-center gap-1.5">
                                                <i className="ph-fill ph-gift text-sm"></i> Quà Tặng Độc Quyền
                                            </span>
                                            <span id="gift-progress-pct" className="font-extrabold text-gold">70%</span>
                                        </div>
                                        <p className="font-editorial text-[11px] text-ink-muted dark:text-night-muted leading-relaxed" id="gift-status-text">
                                            Thuê thêm <b className="text-wine dark:text-gold font-metadata" id="gift-needed-khoai">10 Khoai</b> để nhận Bookmark mạ vàng HALM!
                                        </p>
                                        <div className="w-full h-2 rounded-full bg-paper-border dark:border-night-border overflow-hidden">
                                            <div id="gift-progress-bar" className="h-full bg-gradient-to-r from-wine to-gold progress-striped transition-all duration-500" style={{width: "70%"}}></div>
                                        </div>
                                    </div>
                
                                    {/* Cost Breakdown Details */}
                                    <div className="space-y-2.5 text-xs font-metadata border-t border-paper-border dark:border-night-border pt-4">
                                        <div className="flex items-center justify-between text-ink-muted dark:text-night-muted">
                                            <span>Tạm tính (<span id="subtotal-count-text">2</span> sách):</span>
                                            <span className="font-bold text-ink dark:text-night-text"><span id="summary-subtotal">25</span> Khoai</span>
                                        </div>
                                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                            <span>Ưu đãi giảm giá:</span>
                                            <span className="font-bold"><span id="summary-discount">-5</span> Khoai</span>
                                        </div>
                                        <div className="flex items-center justify-between text-ink-muted dark:text-night-muted">
                                            <span>Phí cấp quyền tài liệu số:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Miễn phí</span>
                                        </div>
                                        <div className="flex items-center justify-between text-ink-muted dark:text-night-muted">
                                            <span>Ưu đãi Hạng Kim Cương:</span>
                                            <span className="font-bold text-wine dark:text-gold">Đã kích hoạt</span>
                                        </div>
                                    </div>
                
                                    {/* Total Section */}
                                    <div className="border-t border-paper-border dark:border-night-border pt-4 space-y-1">
                                        <div className="flex items-baseline justify-between">
                                            <span className="font-display font-bold text-sm text-ink dark:text-night-text">Tổng Thanh Toán:</span>
                                            <div className="text-right">
                                                <span className="font-display font-black text-2xl sm:text-3xl text-wine dark:text-gold" id="summary-total">20</span>
                                                <span className="font-metadata font-bold text-xs uppercase text-gold ml-1">Khoai <i className="ph-fill ph-coins"></i></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] font-metadata text-ink-muted dark:text-night-muted">
                                            <span>Số dư sau khi thanh toán:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400"><span id="remaining-balance-display">1,230</span> Khoai</span>
                                        </div>
                                    </div>
                
                                    {/* Checkout CTA Button */}
                                    <button type="button" id="btn-checkout" onClick={() => { window.handleCheckoutProcess() }} className="w-full py-3.5 px-6 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer">
                                        <span>Xác Nhận Thuê Sách Ngay</span>
                                        <i className="ph-bold ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
                                    </button>
                                </div>
                
                            </div>
                
                        </div>
                
                
                        {/* ========================================================
                             SÁCH CÓ LƯỢT ĐỌC NHIỀU NHẤT & GỢI Ý THUÊ CÙNG (TỈ LỆ CHUẨN TC.HTML)
                             ======================================================== */}
                        <section className="mt-4 pt-10 border-t border-paper-border dark:border-night-border">
                            
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-2 text-wine dark:text-gold text-xs font-metadata font-bold uppercase tracking-wider mb-1">
                                        <i className="ph-bold ph-fire"></i> Xu Hướng Đọc Tuần Này
                                    </div>
                                    <h2 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text tracking-tight">
                                        Sách Có Lượt Đọc Nhiều Nhất & Gợi Ý Thuê Cùng
                                    </h2>
                                </div>
                
                                {/* Navigation Arrow Controls htmlFor Shelf */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button type="button" onClick={() => { window.scrollShelf('trending-cart-shelf', -1) }} className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center text-xs text-ink dark:text-night-text transition-all" title="Xem sách trước">
                                        <i className="ph-bold ph-caret-left"></i>
                                    </button>
                                    <button type="button" onClick={() => { window.scrollShelf('trending-cart-shelf', 1) }} className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-card hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center text-xs text-ink dark:text-night-text transition-all" title="Xem sách tiếp">
                                        <i className="ph-bold ph-caret-right"></i>
                                    </button>
                                </div>
                            </div>
                
                            {/* Interactive Shelf: Tỉ lệ card w-[190px] sm:w-[210px] aspect-[2/3] chuẩn xác 100% tc.html */}
                            <div className="shelf-scroll-container" id="trending-cart-shelf">
                                <div className="w-full py-10 text-center text-sm font-editorial text-ink-muted dark:text-night-muted">
                                    Dữ liệu sách xu hướng đang được cập nhật.
                                </div>
                                {false && <>
                                
                                {/* Card 1: Mắt Biếc (Top 1 trending) */}
                                <div className="w-[185px] sm:w-[205px] lg:w-[215px] shrink-0 snap-start p-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border group flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 shadow-sm" data-book-id="rec-1">
                                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-night-card shadow-md mb-3">
                                        <img src="https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=400&auto=format&fit=crop" 
                                             alt="Mắt Biếc" 
                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        {/* Top ranking badge */}
                                        <div className="font-metadata absolute top-2 left-2 px-1.5 py-0.5 rounded bg-rose-600/90 backdrop-blur-sm text-[10px] text-white font-bold flex items-center gap-0.5">
                                            <i className="ph-bold ph-fire"></i> Top 1
                                        </div>
                                        {/* Star rating */}
                                        <div className="font-metadata absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-gold font-bold flex items-center gap-0.5">
                                            <i className="ph-fill ph-star"></i> 4.9
                                        </div>
                                        {/* View count badge */}
                                        <div className="font-metadata absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-white font-medium flex items-center gap-1">
                                            <i className="ph-bold ph-eye"></i> 38.2k đọc
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors" title="Mắt Biếc">
                                            Mắt Biếc
                                        </h4>
                                        <p className="font-metadata text-xs text-ink-muted dark:text-night-muted line-clamp-1">
                                            Nguyễn Nhật Ánh
                                        </p>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-between">
                                        <div>
                                            <span className="font-metadata font-bold text-xs text-wine dark:text-gold">8 Khoai</span>
                                            <span className="text-[10px] font-metadata text-ink-muted dark:text-night-muted">/7n</span>
                                        </div>
                                        <button type="button" onClick={() => { window.addRecommendedBook('rec-1', 'Mắt Biếc', 'Nguyễn Nhật Ánh', 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=400&auto=format&fit=crop', 8, 'Văn học') }} className="w-7 h-7 rounded-full bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center text-xs transition-colors" title="Thêm vào giỏ">
                                            <i className="ph-bold ph-plus"></i>
                                        </button>
                                    </div>
                                </div>
                
                                {/* Card 2: Đắc Nhân Tâm (Top 2 trending) */}
                                <div className="w-[185px] sm:w-[205px] lg:w-[215px] shrink-0 snap-start p-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border group flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 shadow-sm" data-book-id="rec-2">
                                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-night-card shadow-md mb-3">
                                        <img src="https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=400&auto=format&fit=crop" 
                                             alt="Đắc Nhân Tâm" 
                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        <div className="font-metadata absolute top-2 left-2 px-1.5 py-0.5 rounded bg-amber-600/90 backdrop-blur-sm text-[10px] text-white font-bold flex items-center gap-0.5">
                                            Top 2
                                        </div>
                                        <div className="font-metadata absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-gold font-bold flex items-center gap-0.5">
                                            <i className="ph-fill ph-star"></i> 4.8
                                        </div>
                                        <div className="font-metadata absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-white font-medium flex items-center gap-1">
                                            <i className="ph-bold ph-eye"></i> 29.4k đọc
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors" title="Đắc Nhân Tâm">
                                            Đắc Nhân Tâm
                                        </h4>
                                        <p className="font-metadata text-xs text-ink-muted dark:text-night-muted line-clamp-1">
                                            Dale Carnegie
                                        </p>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-between">
                                        <div>
                                            <span className="font-metadata font-bold text-xs text-wine dark:text-gold">10 Khoai</span>
                                            <span className="text-[10px] font-metadata text-ink-muted dark:text-night-muted">/7n</span>
                                        </div>
                                        <button type="button" onClick={() => { window.addRecommendedBook('rec-2', 'Đắc Nhân Tâm', 'Dale Carnegie', 'https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=400&auto=format&fit=crop', 10, 'Kỹ năng') }} className="w-7 h-7 rounded-full bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center text-xs transition-colors" title="Thêm vào giỏ">
                                            <i className="ph-bold ph-plus"></i>
                                        </button>
                                    </div>
                                </div>
                
                                {/* Card 3: Chiến Binh Cầu Vồng (Top 3 trending) */}
                                <div className="w-[185px] sm:w-[205px] lg:w-[215px] shrink-0 snap-start p-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border group flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 shadow-sm" data-book-id="rec-3">
                                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-night-card shadow-md mb-3">
                                        <img src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop" 
                                             alt="Chiến Binh Cầu Vồng" 
                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        <div className="font-metadata absolute top-2 left-2 px-1.5 py-0.5 rounded bg-indigo-600/90 backdrop-blur-sm text-[10px] text-white font-bold flex items-center gap-0.5">
                                            Top 3
                                        </div>
                                        <div className="font-metadata absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-gold font-bold flex items-center gap-0.5">
                                            <i className="ph-fill ph-star"></i> 5.0
                                        </div>
                                        <div className="font-metadata absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-white font-medium flex items-center gap-1">
                                            <i className="ph-bold ph-eye"></i> 24.1k đọc
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors" title="Chiến Binh Cầu Vồng">
                                            Chiến Binh Cầu Vồng
                                        </h4>
                                        <p className="font-metadata text-xs text-ink-muted dark:text-night-muted line-clamp-1">
                                            Andrea Hirata
                                        </p>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-between">
                                        <div>
                                            <span className="font-metadata font-bold text-xs text-wine dark:text-gold">12 Khoai</span>
                                            <span className="text-[10px] font-metadata text-ink-muted dark:text-night-muted">/7n</span>
                                        </div>
                                        <button type="button" onClick={() => { window.addRecommendedBook('rec-3', 'Chiến Binh Cầu Vồng', 'Andrea Hirata', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop', 12, 'Tiểu thuyết') }} className="w-7 h-7 rounded-full bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center text-xs transition-colors" title="Thêm vào giỏ">
                                            <i className="ph-bold ph-plus"></i>
                                        </button>
                                    </div>
                                </div>
                
                                {/* Card 4: Những Ngày Thu Lịch Sử */}
                                <div className="w-[185px] sm:w-[205px] lg:w-[215px] shrink-0 snap-start p-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border group flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 shadow-sm" data-book-id="rec-4">
                                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-night-card shadow-md mb-3">
                                        <img src="https://bizweb.dktcdn.net/100/197/269/products/nhung-ngay-thu-lich-su-nxb-chinh-tri-quoc-gia-su-that-1.jpg?v=1629864270453" 
                                             alt="Những Ngày Thu Lịch Sử" 
                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        <div className="font-metadata absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-gold font-bold flex items-center gap-0.5">
                                            <i className="ph-fill ph-star"></i> 4.9
                                        </div>
                                        <div className="font-metadata absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-white font-medium flex items-center gap-1">
                                            <i className="ph-bold ph-eye"></i> 18.6k đọc
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors" title="Những Ngày Thu Lịch Sử">
                                            Những Ngày Thu Lịch Sử
                                        </h4>
                                        <p className="font-metadata text-xs text-ink-muted dark:text-night-muted line-clamp-1">
                                            NXB Chính Trị Quốc Gia
                                        </p>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-between">
                                        <div>
                                            <span className="font-metadata font-bold text-xs text-wine dark:text-gold">10 Khoai</span>
                                            <span className="text-[10px] font-metadata text-ink-muted dark:text-night-muted">/7n</span>
                                        </div>
                                        <button type="button" onClick={() => { window.addRecommendedBook('rec-4', 'Những Ngày Thu Lịch Sử', 'NXB Chính Trị Quốc Gia', 'https://bizweb.dktcdn.net/100/197/269/products/nhung-ngay-thu-lich-su-nxb-chinh-tri-quoc-gia-su-that-1.jpg?v=1629864270453', 10, 'Tư liệu lịch sử') }} className="w-7 h-7 rounded-full bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center text-xs transition-colors" title="Thêm vào giỏ">
                                            <i className="ph-bold ph-plus"></i>
                                        </button>
                                    </div>
                                </div>
                
                                {/* Card 5: Bác Hồ Viết Di Chúc */}
                                <div className="w-[185px] sm:w-[205px] lg:w-[215px] shrink-0 snap-start p-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border group flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 shadow-sm" data-book-id="rec-5">
                                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-night-card shadow-md mb-3">
                                        <img src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=400&auto=format&fit=crop" 
                                             alt="Bác Hồ Viết Di Chúc" 
                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        <div className="font-metadata absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-gold font-bold flex items-center gap-0.5">
                                            <i className="ph-fill ph-star"></i> 4.9
                                        </div>
                                        <div className="font-metadata absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-white font-medium flex items-center gap-1">
                                            <i className="ph-bold ph-eye"></i> 21.0k đọc
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors" title="Bác Hồ Viết Di Chúc">
                                            Bác Hồ Viết Di Chúc
                                        </h4>
                                        <p className="font-metadata text-xs text-ink-muted dark:text-night-muted line-clamp-1">
                                            Vũ Kỳ
                                        </p>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-between">
                                        <div>
                                            <span className="font-metadata font-bold text-xs text-wine dark:text-gold">10 Khoai</span>
                                            <span className="text-[10px] font-metadata text-ink-muted dark:text-night-muted">/7n</span>
                                        </div>
                                        <button type="button" onClick={() => { window.addRecommendedBook('rec-5', 'Bác Hồ Viết Di Chúc', 'Vũ Kỳ', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=400&auto=format&fit=crop', 10, 'Hồi ký') }} className="w-7 h-7 rounded-full bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center text-xs transition-colors" title="Thêm vào giỏ">
                                            <i className="ph-bold ph-plus"></i>
                                        </button>
                                    </div>
                                </div>
                
                                {/* Card 6: Chất Michelle (Becoming) */}
                                <div className="w-[185px] sm:w-[205px] lg:w-[215px] shrink-0 snap-start p-3 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border group flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 shadow-sm" data-book-id="rec-6">
                                    <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-night-card shadow-md mb-3">
                                        <img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=400&auto=format&fit=crop" 
                                             alt="Chất Michelle" 
                                             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        <div className="font-metadata absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-gold font-bold flex items-center gap-0.5">
                                            <i className="ph-fill ph-star"></i> 4.9
                                        </div>
                                        <div className="font-metadata absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/65 backdrop-blur-sm text-[10px] text-white font-medium flex items-center gap-1">
                                            <i className="ph-bold ph-eye"></i> 16.5k đọc
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-display font-bold text-sm text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors" title="Chất Michelle (Becoming)">
                                            Chất Michelle
                                        </h4>
                                        <p className="font-metadata text-xs text-ink-muted dark:text-night-muted line-clamp-1">
                                            Michelle Obama
                                        </p>
                                    </div>
                                    <div className="pt-3 mt-3 border-t border-paper-border/70 dark:border-night-border/70 flex items-center justify-between">
                                        <div>
                                            <span className="font-metadata font-bold text-xs text-wine dark:text-gold">14 Khoai</span>
                                            <span className="text-[10px] font-metadata text-ink-muted dark:text-night-muted">/7n</span>
                                        </div>
                                        <button type="button" onClick={() => { window.addRecommendedBook('rec-6', 'Chất Michelle', 'Michelle Obama', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=400&auto=format&fit=crop', 14, 'Tự truyện') }} className="w-7 h-7 rounded-full bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg flex items-center justify-center text-xs transition-colors" title="Thêm vào giỏ">
                                            <i className="ph-bold ph-plus"></i>
                                        </button>
                                    </div>
                                </div>
                                </>}
                            </div>
                
                        </section>
                
                    </main>
                
                
                    {/* ========================================================
                         FOOTER: 5 CỘT SANG TRỌNG ĐỒNG BỘ TOÀN HỆ THỐNG
                         ======================================================== */}
                    {false && (<footer className="bg-paper-surface dark:bg-night-surface border-t border-paper-border dark:border-night-border pt-12 pb-8 text-ink dark:text-night-text transition-colors">
                        <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
                                
                                {/* Col 1: Brand Info */}
                                <div className="lg:col-span-2 space-y-4">
                                    <a href="testhome/tc.html" className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-wine flex items-center justify-center text-white shadow-md">
                                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src='/logo.png' }} />
                                        </div>
                                        <span className="font-display font-black text-2xl tracking-tight text-ink dark:text-night-text">HALM BOOK</span>
                                    </a>
                                    <p className="font-editorial text-xs text-ink-muted dark:text-night-muted max-w-sm leading-relaxed">
                                        Nền tảng đọc sách thông minh và hệ sinh thái tài liệu số hàng đầu Việt Nam. Tích hợp trợ lý trí tuệ nhân tạo, tối ưu hoá trải nghiệm học thuật và phát triển tư duy đọc.
                                    </p>
                                    <div className="flex items-center gap-3 pt-1">
                                        <a href="#" className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted dark:text-night-muted hover:text-wine dark:hover:text-gold hover:border-wine dark:hover:border-gold transition-colors">
                                            <i className="ph-bold ph-facebook-logo"></i>
                                        </a>
                                        <a href="#" className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted dark:text-night-muted hover:text-wine dark:hover:text-gold hover:border-wine dark:hover:border-gold transition-colors">
                                            <i className="ph-bold ph-youtube-logo"></i>
                                        </a>
                                        <a href="#" className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted dark:text-night-muted hover:text-wine dark:hover:text-gold hover:border-wine dark:hover:border-gold transition-colors">
                                            <i className="ph-bold ph-tiktok-logo"></i>
                                        </a>
                                        <a href="#" className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted dark:text-night-muted hover:text-wine dark:hover:text-gold hover:border-wine dark:hover:border-gold transition-colors">
                                            <i className="ph-bold ph-telegram-logo"></i>
                                        </a>
                                    </div>
                                </div>
                
                                {/* Col 2: Khám Phá */}
                                <div className="space-y-3">
                                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink dark:text-night-text">Khám Phá</h4>
                                    <ul className="space-y-2 text-xs font-metadata text-ink-muted dark:text-night-muted">
                                        <li><a href="testhome/tc.html" className="hover:text-wine dark:hover:text-gold transition-colors">Trang Chủ</a></li>
                                        <li><a href="offers.html" className="hover:text-wine dark:hover:text-gold transition-colors">Ưu Đãi Đặc Quyền</a></li>
                                        <li><a href="tiers.html" className="hover:text-wine dark:hover:text-gold transition-colors">Gói Hội Viên</a></li>
                                        <li><a href="my-books.html" className="hover:text-wine dark:hover:text-gold transition-colors">Tủ Sách Cá Nhân</a></li>
                                        <li><a href="news.html" className="hover:text-wine dark:hover:text-gold transition-colors">Tin Tức & Sự Kiện</a></li>
                                    </ul>
                                </div>
                
                                {/* Col 3: Dịch Vụ Thuê */}
                                <div className="space-y-3">
                                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink dark:text-night-text">Dịch Vụ Thuê</h4>
                                    <ul className="space-y-2 text-xs font-metadata text-ink-muted dark:text-night-muted">
                                        <li><a href="cart.html" className="text-wine dark:text-gold font-bold">Giỏ Hàng Của Bạn</a></li>
                                        <li><a href="profile.html" className="hover:text-wine dark:hover:text-gold transition-colors">Lịch Sử Thuê Sách</a></li>
                                        <li><a href="tiers.html" className="hover:text-wine dark:hover:text-gold transition-colors">Nạp Khoai Thưởng</a></li>
                                        <li><a href="offers.html" className="hover:text-wine dark:hover:text-gold transition-colors">Mã Giảm Giá Đang Có</a></li>
                                        <li><a href="my-books.html" className="hover:text-wine dark:hover:text-gold transition-colors">Gia Hạn Bản Quyền</a></li>
                                    </ul>
                                </div>
                
                                {/* Col 4: Hỗ Trợ & Liên Hệ */}
                                <div className="space-y-3">
                                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink dark:text-night-text">Liên Hệ</h4>
                                    <ul className="space-y-2 text-xs font-metadata text-ink-muted dark:text-night-muted">
                                        <li className="flex items-start gap-2">
                                            <i className="ph-bold ph-map-pin text-sm text-wine dark:text-gold shrink-0 mt-0.5"></i>
                                            <span>03 Quang Trung, Q. Hải Châu, TP. Đà Nẵng</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-phone text-sm text-wine dark:text-gold shrink-0"></i>
                                            <span>0793 503 369</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-envelope text-sm text-wine dark:text-gold shrink-0"></i>
                                            <span>contact@halmbook.vn</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <i className="ph-bold ph-clock text-sm text-wine dark:text-gold shrink-0"></i>
                                            <span>T2 - CN: 08:00 - 22:00</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                
                            {/* Bottom Copyright */}
                            <div className="pt-6 border-t border-paper-border dark:border-night-border flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-metadata text-ink-muted dark:text-night-muted">
                                <div>
                                    © 2026 HALM BOOK. Bản quyền thuộc về Đồ Án Tốt Nghiệp 2026.
                                </div>
                                <div className="flex items-center gap-4">
                                    <a href="#" className="hover:underline">Điều khoản thuê sách</a>
                                    <a href="#" className="hover:underline">Chính sách hoàn Khoai</a>
                                    <a href="#" className="hover:underline">Bản quyền số</a>
                                </div>
                            </div>
                        </div>
                    </footer>)}
                
                
                    {/* ========================================================
                         MODAL 1: BOOK READER PREVIEW MODAL
                         ======================================================== */}
                    <div id="preview-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
                        <div className="w-full max-w-2xl bg-paper-surface dark:bg-night-card rounded-2xl border border-paper-border dark:border-night-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transform scale-95 transition-transform duration-300" id="preview-modal-dialog">
                            
                            {/* Modal Header */}
                            <div className="p-5 border-b border-paper-border dark:border-night-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-wine/10 dark:bg-gold/15 flex items-center justify-center text-wine dark:text-gold">
                                        <i className="ph-bold ph-book-open text-lg"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-display font-black text-base text-ink dark:text-night-text" id="preview-modal-title">
                                            Đọc Thử Tác Phẩm
                                        </h3>
                                        <p className="font-metadata text-xs text-ink-muted dark:text-night-muted" id="preview-modal-author">
                                            Tác giả & Bản quyền số
                                        </p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => { window.closeBookPreview() }} className="w-8 h-8 rounded-full border border-paper-border dark:border-night-border flex items-center justify-center text-ink-muted hover:text-ink dark:hover:text-white transition-colors">
                                    <i className="ph-bold ph-x text-sm"></i>
                                </button>
                            </div>
                
                            {/* Modal Body (Excerpt) */}
                            <div className="p-6 overflow-y-auto space-y-4 font-editorial text-xs sm:text-sm text-ink-muted dark:text-night-muted leading-relaxed" id="preview-modal-content">
                                <p>Nội dung bản đọc thử mẫu đang được tải...</p>
                            </div>
                
                            {/* Modal Footer */}
                            <div className="p-4 border-t border-paper-border dark:border-night-border bg-paper-200/50 dark:bg-night-surface flex items-center justify-between">
                                <span className="text-xs font-metadata text-ink-muted dark:text-night-muted">
                                    Trích đoạn 3 chương đầu tiên
                                </span>
                                <button type="button" onClick={() => { window.closeBookPreview() }} className="px-5 py-2 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-xs uppercase tracking-wider transition-colors">
                                    Đã Hiểu & Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                
                
                    {/* ========================================================
                         MODAL 2: CHECKOUT SUCCESS CONFIRMATION MODAL
                         ======================================================== */}
                    <div id="checkout-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
                        <div className="w-full max-w-md bg-paper-surface dark:bg-night-card rounded-2xl border border-paper-border dark:border-night-border shadow-2xl p-6 sm:p-7 text-center space-y-5 transform scale-95 transition-transform duration-300" id="checkout-modal-dialog">
                            
                            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center text-3xl shadow-lg">
                                <i className="ph-bold ph-check"></i>
                            </div>
                
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-metadata font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                    Giao Dịch Thành Công
                                </span>
                                <h3 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text">
                                    Thuê Sách Hoàn Tất!
                                </h3>
                                <p className="font-editorial text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                                    Đã thanh toán <b className="text-wine dark:text-gold font-metadata" id="checkout-receipt-paid">20 Khoai</b>. Toàn bộ sách đã được cấp quyền đọc và chuyển tới <b>Tủ Sách Cá Nhân</b> của bạn.
                                </p>
                            </div>
                
                            <div className="p-4 rounded-xl bg-paper-200/60 dark:bg-night-surface border border-paper-border dark:border-night-border space-y-2 text-left text-xs font-metadata">
                                <div className="flex justify-between text-ink-muted dark:text-night-muted">
                                    <span>Mã giao dịch:</span>
                                    <span className="font-bold text-ink dark:text-night-text" id="checkout-tx-code">HLM-882910</span>
                                </div>
                                <div className="flex justify-between text-ink-muted dark:text-night-muted">
                                    <span>Số dư ví còn lại:</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400" id="checkout-final-balance">1,230 Khoai</span>
                                </div>
                                <div className="flex justify-between text-ink-muted dark:text-night-muted">
                                    <span>Trạng thái bản quyền:</span>
                                    <span className="font-bold text-wine dark:text-gold">Sẵn sàng đọc Offline</span>
                                </div>
                            </div>
                
                            <div className="flex items-center gap-3 pt-2">
                                <a href="my-books.html" className="flex-1 py-3 px-4 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-xs uppercase tracking-wider shadow-md transition-all">
                                    Đến Tủ Sách Đọc Ngay
                                </a>
                                <button type="button" onClick={() => { window.closeCheckoutModal() }} className="py-3 px-4 rounded-xl border border-paper-border dark:border-night-border text-xs font-metadata font-bold text-ink-muted hover:text-ink dark:hover:text-white transition-colors">
                                    Ở Lại
                                </button>
                            </div>
                
                        </div>
                    </div>
                
                
                    {/* ========================================================
                         MODAL 3: DELETE CONFIRMATION POPUP (CHUẨN LUXURY POPUP)
                         ======================================================== */}
                    <div id="delete-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-300">
                        <div className="w-full max-w-md bg-paper-surface dark:bg-night-card rounded-2xl border border-paper-border dark:border-night-border shadow-2xl p-6 sm:p-7 text-center space-y-5 transform scale-95 transition-transform duration-300" id="delete-confirm-modal-dialog">
                            
                            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center text-3xl shadow-lg">
                                <i className="ph-bold ph-trash"></i>
                            </div>
                
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-metadata font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">
                                    Xác Nhận Hành Động
                                </span>
                                <h3 className="font-display font-black text-xl sm:text-2xl text-ink dark:text-night-text" id="delete-modal-title">
                                    Xóa Tác Phẩm Khỏi Giỏ Hàng?
                                </h3>
                                <p className="font-editorial text-xs text-ink-muted dark:text-night-muted leading-relaxed" id="delete-modal-message">
                                    Bạn có chắc chắn muốn xóa tác phẩm đã chọn khỏi giỏ hàng?
                                </p>
                            </div>
                
                            {/* List preview of items to delete */}
                            <div id="delete-modal-preview-list" className="max-h-44 overflow-y-auto space-y-2 text-left p-2.5 rounded-xl bg-paper-200/60 dark:bg-night-surface border border-paper-border dark:border-night-border text-xs font-metadata">
                                {/* Injected via JS */}
                            </div>
                
                            <div className="flex items-center gap-3 pt-2">
                                <button type="button" onClick={() => { window.closeDeleteConfirmModal() }} className="flex-1 py-3 px-4 rounded-xl border border-paper-border dark:border-night-border text-xs font-metadata font-bold text-ink-muted hover:text-ink dark:hover:text-white hover:bg-paper-200 dark:hover:bg-night-surface transition-colors cursor-pointer">
                                    Hủy Bỏ
                                </button>
                                <button type="button" id="btn-confirm-delete" onClick={() => { window.confirmDeleteExecution() }} className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-metadata font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5">
                                    <i className="ph-bold ph-trash"></i>
                                    <span>Xác Nhận Xóa</span>
                                </button>
                            </div>
                
                        </div>
                    </div>
                
                
                    {/* ========================================================
                         FLOATING UTILITIES: SCROLL TO TOP & CHATBOT AI
                         ======================================================== */}
                    {/* Scroll To Top Button */}
                    <button id="btnScrollToTop" title="Lên đầu trang" aria-label="Lên đầu trang">
                        <i className="ph-bold ph-arrow-up text-lg"></i>
                    </button>
                
                    {/* Floating Chatbot Widget */}
                    <div id="chatbot-container">
                        {/* Floating Trigger Button */}
                        <button id="chatbot-trigger" onClick={() => { window.toggleChatbot() }} className="w-12 h-12 rounded-full bg-wine dark:bg-gold text-white dark:text-night-bg shadow-xl flex items-center justify-center hover:scale-110 transition-transform cursor-pointer" title="Hỏi trợ lý HALM AI">
                            <i className="ph-bold ph-sparkle text-xl"></i>
                        </button>
                
                        {/* Chat Window */}
                        <div id="chat-window">
                            <div className="p-4 bg-wine dark:bg-night-surface text-white border-b border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                                        <i className="ph-bold ph-robot text-base text-gold"></i>
                                    </div>
                                    <div>
                                        <div className="font-display font-bold text-xs">HALM AI Reader Concierge</div>
                                        <div className="text-[10px] font-metadata text-white/70">Trợ lý sách & giỏ hàng 24/7</div>
                                    </div>
                                </div>
                                <button onClick={() => { window.toggleChatbot() }} className="text-white/80 hover:text-white">
                                    <i className="ph-bold ph-x text-sm"></i>
                                </button>
                            </div>
                
                            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-editorial text-xs" id="chat-messages-container">
                                <div className="flex items-start gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center shrink-0 text-xs">
                                        <i className="ph-bold ph-sparkle"></i>
                                    </div>
                                    <div className="p-3 rounded-2xl rounded-tl-sm bg-paper-200 dark:bg-night-surface text-ink dark:text-night-text leading-relaxed">
                                        Xin chào! Tôi có thể giúp gì cho bạn về thời hạn thuê sách, mã giảm giá hay kiểm tra số dư Khoai trong giỏ hàng hôm nay?
                                    </div>
                                </div>
                            </div>
                
                            <div className="p-3 border-t border-paper-border dark:border-night-border bg-paper-surface dark:bg-night-surface flex items-center gap-2">
                                <input type="text" id="chat-input" placeholder="Nhập câu hỏi của bạn..." 
                                       className="flex-1 px-3 py-2 rounded-xl text-xs bg-paper-200/70 dark:bg-night-card border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold text-ink dark:text-night-text"
                                       onKeyDown={(event) => { if(event.key==='Enter') window.sendChatMessage() }} />
                                <button onClick={() => { window.sendChatMessage() }} className="p-2 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg transition-colors">
                                    <i className="ph-bold ph-paper-plane-right text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                
                
                    {/* ========================================================
                         JAVASCRIPT LOGIC: GIỎ HÀNG, TÍNH TOÁN, MÃ GIẢM GIÁ, MODAL
                         ======================================================== */}
            </div>
            </UserLayout>
        </>
    );
}
