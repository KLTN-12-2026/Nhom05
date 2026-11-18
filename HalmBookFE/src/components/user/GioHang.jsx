import { cartThemeStyles, cartStyles, inlinePageStyle1 } from './styles/GioHang.styles.js';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import UserLayout from './layout/UserLayout';
import axiosInstance from '@/services/axiosClient';
import { getTierInfo } from '@/utils/tierUtils';





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
        let userWalletBalance = 0; // Lấy số dư Khoai thực tế từ tài khoản đăng nhập
        let userTierDiscountPercent = 0; // Chiết khấu theo hạng hội viên (5%, 10%, 20%)
        let userTierName = 'Thợ Cày';
        let appliedCouponDiscount = 0; // Mặc định không áp mã giảm giá
        let appliedCouponName = '';

        // Cart items data state
        let cartItems = [];

        // --- 2. CALCULATE & RE-RENDER TOTALS ---
        function recalculateCart() {
            const selectedItems = cartItems.filter(item => item.selected);
            const totalItemsCount = cartItems.length;
            const selectedItemsCount = selectedItems.length;

            // Subtotal
            const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);

            // Tier Discount (Chiết khấu hạng thành viên độc quyền)
            const tierDiscount = (subtotal > 0 && userTierDiscountPercent > 0)
                ? Math.round(subtotal * userTierDiscountPercent / 100)
                : 0;

            // Coupon Discount
            const couponDiscount = (subtotal > 0 && appliedCouponDiscount > 0) ? Math.min(appliedCouponDiscount, subtotal) : 0;

            // Combined Discount
            const discount = Math.min(tierDiscount + couponDiscount, subtotal);

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

            const tierLabelEl = document.getElementById('summary-tier-label');
            if (tierLabelEl) {
                tierLabelEl.textContent = `Ưu đãi ${userTierName} (-${userTierDiscountPercent}%):`;
            }
            const tierValEl = document.getElementById('summary-tier-val');
            if (tierValEl) {
                tierValEl.textContent = tierDiscount > 0 ? `-${tierDiscount} Khoai` : (userTierDiscountPercent > 0 ? `-${userTierDiscountPercent}%` : 'Đã kích hoạt');
            }

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

            // Select all checkbox state
            const checkAllEl = document.getElementById('check-all');
            if (checkAllEl) {
                checkAllEl.checked = totalItemsCount > 0 && selectedItemsCount === totalItemsCount;
            }

            // Empty state toggle & matching height with right summary sidebar
            const emptyStateEl = document.getElementById('cart-empty-state');
            const hasItemsWrapperEl = document.getElementById('cart-has-items-wrapper');
            const checkoutBtnEl = document.getElementById('btn-checkout');

            if (totalItemsCount === 0) {
                if (emptyStateEl) {
                    emptyStateEl.classList.remove('hidden');
                    emptyStateEl.classList.add('flex');
                }
                if (hasItemsWrapperEl) {
                    hasItemsWrapperEl.classList.add('hidden');
                }
                if (checkoutBtnEl) {
                    checkoutBtnEl.disabled = true;
                    checkoutBtnEl.classList.add('opacity-50', 'cursor-not-allowed');
                }
            } else {
                if (emptyStateEl) {
                    emptyStateEl.classList.add('hidden');
                    emptyStateEl.classList.remove('flex');
                }
                if (hasItemsWrapperEl) {
                    hasItemsWrapperEl.classList.remove('hidden');
                }
                if (checkoutBtnEl) {
                    checkoutBtnEl.disabled = selectedItemsCount === 0;
                    checkoutBtnEl.classList.toggle('opacity-50', selectedItemsCount === 0);
                    checkoutBtnEl.classList.toggle('cursor-not-allowed', selectedItemsCount === 0);
                }
            }

            if (typeof updateRecommendationShelfStatus === 'function') {
                updateRecommendationShelfStatus();
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

        async function updateItemDuration(itemId, valueString) {
            // valueString format: "days|price|planKey"
            const parts = valueString.split('|');
            const days = Number(parts[0]);
            const price = Number(parts[1]);
            const planKey = parts[2] || (days >= 9999 ? 'forever' : String(days));
            const item = cartItems.find(i => i.id === itemId);
            if (item) {
                item.days = days;
                item.price = price;
                item.planKey = planKey;
                const priceEl = document.getElementById(`price-${itemId}`);
                if (priceEl) priceEl.textContent = price;
                const cardEl = document.querySelector(`[data-item-id="${itemId}"]`);
                if (cardEl) {
                    cardEl.dataset.price = price;
                    cardEl.dataset.duration = days;
                }
                recalculateCart();

                // Đồng bộ lựa chọn số ngày thuê lên server
                const targetBookId = item.bookId || (String(itemId).startsWith('rec-') ? String(itemId).replace('rec-', '') : String(itemId));
                if (targetBookId) {
                    try {
                        await axiosInstance.post('/api/home/cart/add', {
                            bookId: targetBookId,
                            planKey: planKey,
                            price: price
                        });
                        window.dispatchEvent(new Event('halm-cart-updated'));
                    } catch (e) {
                        console.warn('Lỗi đồng bộ gói thuê lên server:', e);
                    }
                }

                const durationLabel = planKey === 'forever' ? 'Mua đứt (Trọn đời)' : `${days} ngày`;
                showToast('Thời hạn thuê', `Đã cập nhật ${item.title}: ${durationLabel} (${price} Khoai).`);
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

        async function confirmDeleteExecution() {
            if (!pendingDeleteTarget) return;

            if (pendingDeleteTarget === 'selected') {
                const selectedItems = cartItems.filter(i => i.selected);
                const count = selectedItems.length;
                for (const item of selectedItems) {
                    if (item.cartItemId) {
                        try {
                            await axiosInstance.delete(`/api/home/cart/items/${item.cartItemId}`);
                        } catch (err) {
                            console.error('Lỗi khi xóa cart item từ server:', item.cartItemId, err);
                        }
                    }
                    const cardEl = document.querySelector(`[data-item-id="${item.id}"]`);
                    if (cardEl) {
                        cardEl.style.transition = 'all 0.3s ease';
                        cardEl.style.opacity = '0';
                        cardEl.style.transform = 'scale(0.95)';
                        setTimeout(() => cardEl.remove(), 250);
                    }
                }
                cartItems = cartItems.filter(i => !i.selected);
                setTimeout(() => recalculateCart(), 260);
                window.dispatchEvent(new Event('halm-cart-updated'));
                showToast('Đã xóa thành công', `Đã loại bỏ ${count} tác phẩm đã chọn khỏi giỏ hàng.`);
            } else {
                const itemId = pendingDeleteTarget;
                const itemIndex = cartItems.findIndex(i => i.id === itemId);
                if (itemIndex > -1) {
                    const item = cartItems[itemIndex];
                    const deletedName = item.title;
                    if (item.cartItemId) {
                        try {
                            await axiosInstance.delete(`/api/home/cart/items/${item.cartItemId}`);
                        } catch (err) {
                            console.error('Lỗi khi xóa cart item từ server:', item.cartItemId, err);
                        }
                    }
                    cartItems.splice(itemIndex, 1);
                    const cardEl = document.querySelector(`[data-item-id="${itemId}"]`);
                    if (cardEl) {
                        cardEl.style.transition = 'all 0.3s ease';
                        cardEl.style.opacity = '0';
                        cardEl.style.transform = 'scale(0.95)';
                        setTimeout(() => cardEl.remove(), 250);
                    }
                    setTimeout(() => recalculateCart(), 260);
                    window.dispatchEvent(new Event('halm-cart-updated'));
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
        function addRecommendedBook(recId, title, author, cover, price, category, rentalDays = 7, planKey = '7', originalBookId = null) {
            // Check if already in cart
            const existing = cartItems.find(i => i.title === title);
            if (existing) {
                showToast('Thông báo', `"${title}" đã có sẵn trong giỏ hàng của bạn.`);
                return;
            }

            const serverCartItemId = typeof recId === 'number' || (!isNaN(Number(recId)) && !String(recId).startsWith('rec-') && !String(recId).startsWith('book-rec-')) ? Number(recId) : null;
            const newId = recId ? String(recId) : `book-rec-${Date.now()}`;
            const targetBookId = originalBookId || (String(recId).startsWith('rec-') ? String(recId).replace('rec-', '') : String(recId));
            const newItem = {
                id: newId,
                bookId: targetBookId,
                cartItemId: serverCartItemId,
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

            if (!serverCartItemId && String(recId).startsWith('rec-')) {
                axiosInstance.post('/api/home/cart/add', {
                    bookId: recId,
                    planKey: String(planKey || '7'),
                    price: price
                }).then((res) => {
                    if (res.data?.cartItemId) {
                        newItem.cartItemId = res.data.cartItemId;
                    }
                    window.dispatchEvent(new Event('halm-cart-updated'));
                }).catch(() => {});
            }

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
                                            <option value="1|2|1" ${(rentalDays === 1 || String(planKey) === '1') ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">1 ngày (2 Khoai)</option>
                                            <option value="3|5|3" ${(rentalDays === 3 || String(planKey) === '3') ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">3 ngày (5 Khoai)</option>
                                            <option value="7|9|7" {((rentalDays === 7 || String(planKey) === '7') && rentalDays < 9999 && String(planKey) !== 'forever') ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">7 ngày (9 Khoai - Tiêu chuẩn)</option>
                                            <option value="15|18|15" ${(rentalDays === 15 || String(planKey) === '15') ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">15 ngày (18 Khoai)</option>
                                            <option value="30|30|30" ${(rentalDays === 30 || String(planKey) === '30') ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">30 ngày (30 Khoai)</option>
                                            <option value="99999|39|forever" ${(rentalDays >= 9999 || String(planKey) === 'forever') ? 'selected' : ''} class="bg-paper-surface dark:bg-night-card text-ink dark:text-night-text">Mua đứt (39 Khoai - Trọn đời)</option>
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

        // --- 8. CHECKOUT PROCESS (THANH TOÁN THUÊ SÁCH BẰNG KHOAI TÂY THỰC TẾ) ---
        async function handleCheckoutProcess() {
            const selectedItems = cartItems.filter(i => i.selected);
            if (selectedItems.length === 0) {
                showToast('Thông báo', 'Vui lòng chọn ít nhất 1 tác phẩm để thuê.');
                return;
            }

            const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
            const tierDiscount = (subtotal > 0 && userTierDiscountPercent > 0)
                ? Math.round(subtotal * userTierDiscountPercent / 100)
                : 0;
            const couponDiscount = (subtotal > 0 && appliedCouponDiscount > 0) ? Math.min(appliedCouponDiscount, subtotal) : 0;
            const discount = Math.min(tierDiscount + couponDiscount, subtotal);
            const total = Math.max(0, subtotal - discount);

            if (userWalletBalance < total) {
                showToast('Số dư không đủ', `Số dư Ví Khoai không đủ (${userWalletBalance.toLocaleString()} < ${total.toLocaleString()} Khoai). Vui lòng nạp thêm Khoai!`);
                return;
            }

            const checkoutBtn = document.getElementById('btn-checkout');
            if (checkoutBtn) {
                checkoutBtn.disabled = true;
                checkoutBtn.innerText = 'Đang xử lý thanh toán...';
            }

            try {
                // Đóng gói danh sách sách gửi lên backend API
                const checkoutItems = selectedItems.map(item => ({
                    bookId: item.bookId || item.id,
                    cartItemId: item.cartItemId,
                    planKey: String(item.planKey || '7'),
                    durationDays: item.days || 7,
                    price: item.price
                }));

                const response = await axiosInstance.post('/api/home/checkout', {
                    items: checkoutItems,
                    paymentMethod: 'POTATO_WALLET',
                    couponCode: appliedCouponName || null,
                    discountAmount: discount
                });

                const result = response.data;
                userWalletBalance = result.remainingPotatoBalance;

                // Cập nhật DOM biên lai
                const paidEl = document.getElementById('checkout-receipt-paid');
                if (paidEl) paidEl.textContent = `${result.totalKhoaiPaid} Khoai`;

                const txCodeEl = document.getElementById('checkout-tx-code');
                if (txCodeEl) txCodeEl.textContent = result.transactionNo;

                const finalBalanceEl = document.getElementById('checkout-final-balance');
                if (finalBalanceEl) finalBalanceEl.textContent = `${userWalletBalance.toLocaleString()} Khoai`;

                // Cập nhật số dư trên thanh header và thẻ số dư
                const navKhoaiEl = document.getElementById('user-khoai-nav');
                if (navKhoaiEl) navKhoaiEl.textContent = userWalletBalance.toLocaleString();
                const walletCardEl = document.getElementById('wallet-balance-display');
                if (walletCardEl) walletCardEl.textContent = userWalletBalance.toLocaleString();

                // Mở Modal Thành Công
                const modal = document.getElementById('checkout-modal');
                const dialog = document.getElementById('checkout-modal-dialog');
                if (modal && dialog) {
                    modal.classList.remove('opacity-0', 'pointer-events-none');
                    dialog.classList.remove('scale-95');
                    dialog.classList.add('scale-100');
                }

                // Xóa các cuốn sách đã thuê khỏi mảng giỏ hàng
                cartItems = cartItems.filter(i => !i.selected);
                document.querySelectorAll('.cart-item-card').forEach(card => {
                    const targetId = card.getAttribute('data-item-id');
                    const stillExists = cartItems.some(i => i.id === targetId);
                    if (!stillExists) card.remove();
                });

                recalculateCart();
                window.dispatchEvent(new CustomEvent('halm-cart-updated'));
                window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                    detail: { potatoBalance: userWalletBalance }
                }));
                window.dispatchEvent(new CustomEvent('halm-bookshelf-updated'));

                showToast('Thành công', 'Đã thuê sách thành công! Sách đã được chuyển vào Tủ Sách Cá Nhân.');
            } catch (err) {
                const errMsg = err?.response?.data?.message || err.message || 'Lỗi khi thực hiện thanh toán.';
                showToast('Thất bại', errMsg);
            } finally {
                if (checkoutBtn) {
                    checkoutBtn.disabled = false;
                    checkoutBtn.innerText = 'Xác Nhận Thuê Sách Ngay';
                }
            }
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
            const savedTheme = localStorage.getItem('color-theme') || localStorage.getItem('halm-theme') || localStorage.getItem('halm_theme') || localStorage.getItem('theme');
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

        const handleThemeChange = (e) => {
            const isDark = e.detail?.isDark;
            if (typeof isDark === 'boolean') {
                document.documentElement.classList.toggle('dark', isDark);
                if (themeIcon) {
                    if (isDark) {
                        themeIcon.classList.remove('ph-moon');
                        themeIcon.classList.add('ph-sun');
                    } else {
                        themeIcon.classList.remove('ph-sun');
                        themeIcon.classList.add('ph-moon');
                    }
                }
                createStarrySky();
            }
        };
        window.addEventListener('halm-theme-change', handleThemeChange);

        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                const tVal = isDark ? 'dark' : 'light';
                ['color-theme', 'halm-theme', 'halm_theme', 'theme'].forEach(k => { try { localStorage.setItem(k, tVal); } catch {} });
                window.dispatchEvent(new CustomEvent('halm-theme-change', { detail: { isDark } }));
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

        async function fetchUserInfo() {
            try {
                const res = await axiosInstance.get('/api/home/customer/info');
                if (res.data) {
                    userWalletBalance = Number(res.data.potatoBalance ?? res.data.khoai ?? res.data.walletBalance ?? 0);
                    const tierInfo = getTierInfo(res.data.membershipTier, userWalletBalance);
                    userTierDiscountPercent = tierInfo.discount;
                    userTierName = tierInfo.cleanName;

                    const navEl = document.getElementById('user-khoai-nav');
                    if (navEl) navEl.textContent = userWalletBalance.toLocaleString();
                    const drawerEl = document.getElementById('drawer-potato-balance');
                    if (drawerEl) drawerEl.textContent = userWalletBalance.toLocaleString();
                    const walletEl = document.getElementById('wallet-balance-display');
                    if (walletEl) walletEl.textContent = userWalletBalance.toLocaleString();
                    recalculateCart();
                }
            } catch {
                // Keep default
            }
        }

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
                        item.planKey || '7',
                        item.bookId
                    );
                });
                recalculateCart();
            } catch (error) {
                console.error('Không thể tải giỏ hàng từ máy chủ:', error);
                cartItems = [];
                recalculateCart();
            } finally {
                loadRecommendations();
            }
        }

        // --- 13. RECOMMENDATION & TRENDING RENT-TOGETHER SYSTEM ---
        const CURATED_TRENDING_BOOKS = [
            {
                book_id: 'B0001',
                bookName: 'Nhà Giả Kim',
                author: 'Paulo Coelho',
                img_url: 'https://covers.openlibrary.org/b/id/10522444-L.jpg',
                rent_price: 9,
                category_name: 'Tiểu thuyết',
                rating: '4.9',
                readCount: 154,
                description: 'Hành trình theo đuổi giấc mơ và lắng nghe trái tim của cậu bé chăn cừu Santiago.'
            },
            {
                book_id: 'B0002',
                bookName: 'Đắc Nhân Tâm',
                author: 'Dale Carnegie',
                img_url: 'https://covers.openlibrary.org/b/id/8225266-L.jpg',
                rent_price: 9,
                category_name: 'Kỹ năng sống',
                rating: '5.0',
                readCount: 142,
                description: 'Nghệ thuật thu phục lòng người và xây dựng mối quan hệ tốt đẹp.'
            },
            {
                book_id: 'B0003',
                bookName: 'Mắt Biếc',
                author: 'Nguyễn Nhật Ánh',
                img_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
                rent_price: 9,
                category_name: 'Văn học',
                rating: '4.8',
                readCount: 128,
                description: 'Câu chuyện tình yêu tuổi học trò đầy tiếc nuối của Ngạn và Hà Lan.'
            },
            {
                book_id: 'B0004',
                bookName: 'Hoàng Tử Bé',
                author: 'Antoine de Saint-Exupéry',
                img_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=600&q=80',
                rent_price: 9,
                category_name: 'Kinh điển',
                rating: '4.9',
                readCount: 115,
                description: 'Một cái nhìn trong trẻo về tình bạn, tình yêu và ý nghĩa cuộc sống qua đôi mắt trẻ thơ.'
            },
            {
                book_id: 'B0005',
                bookName: 'Cây Cam Ngọt Của Tôi',
                author: 'José Mauro de Vasconcelos',
                img_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
                rent_price: 9,
                category_name: 'Văn học',
                rating: '5.0',
                readCount: 98,
                description: 'Câu chuyện cảm động về nỗi đau và tình thương của cậu bé Zezé năm tuổi.'
            },
            {
                book_id: 'B0006',
                bookName: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh',
                author: 'Nguyễn Nhật Ánh',
                img_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&w=600&q=80',
                rent_price: 9,
                category_name: 'Tuổi học trò',
                rating: '4.8',
                readCount: 89,
                description: 'Những mảnh ký ức ấu thơ mộc mạc nơi làng quê Việt Nam thanh bình.'
            }
        ];

        let recommendedBooksCache = [...CURATED_TRENDING_BOOKS];

        function renderRecommendedShelf(books) {
            const shelfContainer = document.getElementById('trending-cart-shelf');
            if (!shelfContainer) return;

            let displayBooks = (books && books.length > 0) ? books.slice(0, 6) : CURATED_TRENDING_BOOKS.slice(0, 6);

            const cartBookIds = new Set(cartItems.map(i => String(i.bookId || i.id)));

            const cardsHTML = displayBooks.map((book, idx) => {
                const bookId = String(book.book_id);
                const title = book.bookName;
                const author = book.author;
                const cover = book.img_url;
                const price = (book.rent_price !== undefined && book.rent_price !== null) ? book.rent_price : 9;
                const category = book.category_name || 'Văn học';
                const rating = book.rating || '5.0';
                const readCount = book.readCount || (120 - idx * 7);
                const isInCart = cartBookIds.has(bookId);

                // Rank Badge Styling
                let rankBadge = '';
                let rankBorder = 'border-paper-border dark:border-night-border';
                let rankGlow = '';
                if (idx === 0) {
                    rankBadge = `<div class="absolute -top-2.5 -left-2 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 font-metadata font-black text-[10px] tracking-wider shadow-lg shadow-amber-500/40 border border-yellow-100"><span>👑</span><span>TOP 1</span></div>`;
                    rankBorder = 'border-amber-400/80 ring-1 ring-amber-400/30';
                    rankGlow = 'shadow-[0_4px_20px_rgba(245,158,11,0.18)]';
                } else if (idx === 1) {
                    rankBadge = `<div class="absolute -top-2.5 -left-2 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-slate-200 via-gray-100 to-slate-300 text-slate-900 font-metadata font-black text-[10px] tracking-wider shadow-lg shadow-slate-400/30 border border-white"><span>🥈</span><span>TOP 2</span></div>`;
                    rankBorder = 'border-slate-300 dark:border-slate-400/60 ring-1 ring-slate-300/30';
                } else if (idx === 2) {
                    rankBadge = `<div class="absolute -top-2.5 -left-2 z-20 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 text-white font-metadata font-black text-[10px] tracking-wider shadow-lg shadow-orange-900/30 border border-amber-300/50"><span>🥉</span><span>TOP 3</span></div>`;
                    rankBorder = 'border-amber-600/60 dark:border-amber-600/60 ring-1 ring-amber-600/30';
                } else {
                    rankBadge = `<div class="absolute -top-2 -left-1.5 z-20 flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-black/80 dark:bg-black/90 backdrop-blur-md text-amber-300 font-metadata font-black text-[9px] border border-amber-500/40 shadow"><span>🔥</span><span>#${idx + 1}</span></div>`;
                }

                // Button CTA state
                const actionButtonHTML = isInCart ? `
                    <button type="button" disabled class="w-full py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-metadata font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-default transition-all">
                        <i class="ph-bold ph-check-circle text-xs"></i> <span>Đã Trong Giỏ</span>
                    </button>
                ` : `
                    <button type="button" onclick="window.handleQuickRentTogether('${bookId}')" id="btn-rent-${bookId}" class="w-full py-1.5 px-2 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer">
                        <i class="ph-bold ph-plus-circle text-xs"></i> <span>+ Thuê Cùng</span>
                    </button>
                `;

                return `
                    <div class="trending-cart-card relative shrink-0 snap-start p-3 sm:p-3.5 rounded-2xl bg-paper-surface dark:bg-night-card border ${rankBorder} ${rankGlow} group flex flex-col justify-between hover:-translate-y-2 hover:shadow-xl transition-all duration-300 w-[190px] sm:w-[210px]" data-book-id="${bookId}">
                        ${rankBadge}
                        <div>
                            <div class="relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-night-card shadow-md mb-2.5 cursor-pointer" onclick="window.location.href='/chitietsach/${bookId}'">
                                <img src="${cover}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.onerror=null;this.src='/logo.png';">
                                <div class="font-metadata absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-[9px] text-amber-300 font-bold flex items-center gap-0.5 shadow">
                                    <i class="ph-fill ph-star text-amber-400"></i> ${rating}
                                </div>
                                <div class="font-metadata absolute bottom-1.5 inset-x-1.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[9px] text-emerald-300 font-medium flex items-center justify-between">
                                    <span class="flex items-center gap-1"><i class="ph-bold ph-fire text-amber-400"></i> ${readCount} đọc</span>
                                    <span class="text-[8px] text-gray-300 uppercase truncate max-w-[65px]">${category}</span>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <h4 class="font-display font-bold text-xs sm:text-[13px] text-ink dark:text-night-text line-clamp-1 group-hover:text-wine dark:group-hover:text-gold transition-colors cursor-pointer" title="${title}" onclick="window.location.href='/chitietsach/${bookId}'">
                                    ${title}
                                </h4>
                                <p class="font-metadata text-[11px] text-ink-muted dark:text-night-muted line-clamp-1">
                                    ${author}
                                </p>
                            </div>
                        </div>

                        <div class="pt-2.5 mt-2.5 border-t border-paper-border/70 dark:border-night-border/70 space-y-2">
                            <div class="flex items-center justify-between">
                                <div>
                                    <span class="font-display font-black text-xs sm:text-[13px] text-wine dark:text-gold flex items-center gap-1">
                                        <span>🥔</span> ${price} Khoai
                                    </span>
                                    <span class="text-[9px] font-metadata text-ink-muted dark:text-night-muted block leading-none">
                                        Gói 7 ngày
                                    </span>
                                </div>
                                <button type="button" onclick="window.previewRecommendedBook('${bookId}')" class="px-2 py-1 rounded-lg border border-paper-border dark:border-night-border hover:bg-paper-200 dark:hover:bg-night-surface text-[10px] font-metadata font-bold text-ink dark:text-night-text transition-colors flex items-center gap-1" title="Đọc thử trích đoạn">
                                    <i class="ph-bold ph-book-open text-xs"></i> <span>Đọc thử</span>
                                </button>
                            </div>
                            <div id="action-wrapper-${bookId}">
                                ${actionButtonHTML}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            shelfContainer.innerHTML = cardsHTML;
        }

        async function loadRecommendations() {
            const shelfContainer = document.getElementById('trending-cart-shelf');
            if (!shelfContainer) return;

            const cartBookIds = cartItems.map(i => i.bookId || i.id).filter(Boolean);
            const cartSet = new Set(cartBookIds.map(String));
            const limit = 6;
            let fetchedBooks = [];

            try {
                let url = `/api/home/books/recommendations?limit=${limit}`;
                if (cartBookIds.length > 0) {
                    url += '&cartBookIds=' + cartBookIds.map(encodeURIComponent).join(',');
                }
                const res = await axiosInstance.get(url);
                fetchedBooks = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            } catch {
                // Endpoint /books/recommendations may be pending or returning 404
            }

            if (!fetchedBooks || fetchedBooks.length === 0) {
                try {
                    const trendingRes = await axiosInstance.get(`/api/home/books/trending?limit=${limit}`);
                    fetchedBooks = Array.isArray(trendingRes.data) ? trendingRes.data : (trendingRes.data?.content || []);
                } catch {}
            }

            if (!fetchedBooks || fetchedBooks.length === 0) {
                try {
                    const fallbackRes = await axiosInstance.get('/api/home/books', {
                        params: { page: 0, size: 10 }
                    });
                    const allBooks = Array.isArray(fallbackRes.data?.content) ? fallbackRes.data.content : (Array.isArray(fallbackRes.data) ? fallbackRes.data : []);
                    fetchedBooks = allBooks.filter(b => !cartSet.has(String(b.book_id || b.id)));
                } catch {}
            }

            // Chuẩn hóa và làm sạch dữ liệu từ API
            let combinedBooks = (fetchedBooks || []).filter(b => !cartSet.has(String(b.book_id || b.id))).map((b, idx) => {
                let rawPrice = (b.rent_price !== undefined && b.rent_price !== null) ? Number(b.rent_price) : 9;
                let normalizedPrice = (rawPrice > 0 && rawPrice <= 50) ? Math.round(rawPrice) : 9;
                return {
                    book_id: b.book_id || b.id || `rec-${idx}`,
                    bookName: b.bookName || b.title || 'Tác phẩm HALM',
                    author: b.author || 'HALM BOOK',
                    img_url: b.img_url || b.cover || b.img || '/logo.png',
                    rent_price: normalizedPrice,
                    category_name: b.category_name || b.category?.category_name || 'Văn học',
                    readCount: b.readCount || (120 - idx * 7),
                    rating: b.rating || '5.0',
                    description: b.description || 'Tác phẩm xuất sắc được chọn lọc trong tuần trên HALM Book.'
                };
            });

            // Nếu số lượng sách chưa đủ 6 cuốn, bổ sung từ kho sách CURATED_TRENDING_BOOKS
            if (combinedBooks.length < 6) {
                const existingIds = new Set(combinedBooks.map(b => String(b.book_id)));
                for (const fallbackBook of CURATED_TRENDING_BOOKS) {
                    if (combinedBooks.length >= 6) break;
                    if (!existingIds.has(String(fallbackBook.book_id)) && !cartSet.has(String(fallbackBook.book_id))) {
                        combinedBooks.push(fallbackBook);
                        existingIds.add(String(fallbackBook.book_id));
                    }
                }
            }

            recommendedBooksCache = combinedBooks.slice(0, 6);
            renderRecommendedShelf(recommendedBooksCache);
        }

        async function handleQuickRentTogether(bookId) {
            const book = recommendedBooksCache.find(b => String(b.book_id) === String(bookId));
            if (!book) return;

            const title = book.bookName;
            const author = book.author;
            const cover = book.img_url;
            const price = (book.rent_price !== undefined && book.rent_price !== null) ? book.rent_price : 9;
            const category = book.category_name || 'Văn học';
            const planKey = '7';
            const rentalDays = 7;

            const existing = cartItems.find(i => String(i.bookId) === String(bookId) || i.title === title);
            if (existing) {
                showToast('Thông báo', `"${title}" đã có sẵn trong giỏ hàng của bạn.`);
                updateRecommendationShelfStatus();
                return;
            }

            const actionWrapper = document.getElementById(`action-wrapper-${bookId}`);
            if (actionWrapper) {
                actionWrapper.innerHTML = `
                    <button type="button" disabled class="w-full py-1.5 px-2 rounded-xl bg-paper-200 dark:bg-night-surface border border-paper-border dark:border-night-border text-ink-muted dark:text-night-muted font-metadata font-bold text-[11px] flex items-center justify-center gap-1 cursor-wait">
                        <div class="w-3.5 h-3.5 rounded-full border-2 border-wine dark:border-gold border-t-transparent animate-spin"></div>
                        <span>Đang thêm...</span>
                    </button>
                `;
            }

            try {
                const res = await axiosInstance.post('/api/home/cart/add', {
                    bookId: String(bookId),
                    planKey: planKey,
                    price: price
                });
                const serverCartItemId = res.data?.cartItemId || null;

                addRecommendedBook(
                    serverCartItemId || bookId,
                    title,
                    author,
                    cover,
                    price,
                    category,
                    rentalDays,
                    planKey,
                    bookId
                );

                window.dispatchEvent(new Event('halm-cart-updated'));
                updateRecommendationShelfStatus();
            } catch (err) {
                console.error('Lỗi khi thêm sách gợi ý vào giỏ:', err);
                updateRecommendationShelfStatus();
                showToast('Lỗi', 'Không thể thêm sách vào giỏ hàng. Vui lòng thử lại!');
            }
        }

        function previewRecommendedBook(bookId) {
            const book = recommendedBooksCache.find(b => String(b.book_id) === String(bookId));
            const titleEl = document.getElementById('preview-modal-title');
            const authorEl = document.getElementById('preview-modal-author');
            const contentEl = document.getElementById('preview-modal-content');
            const modal = document.getElementById('preview-modal');
            const dialog = document.getElementById('preview-modal-dialog');

            if (book) {
                if (titleEl) titleEl.textContent = book.bookName || 'Đọc Thử Tác Phẩm';
                if (authorEl) authorEl.textContent = `${book.author || 'HALM BOOK'} • ${book.category_name || 'Bản quyền số'}`;
                if (contentEl) {
                    contentEl.innerHTML = `
                        <div class="space-y-4 font-editorial text-sm leading-relaxed text-ink dark:text-night-text">
                            <div class="p-3.5 rounded-xl bg-paper-200/60 dark:bg-night-surface border border-paper-border dark:border-night-border mb-3">
                                <span class="text-xs font-metadata font-bold text-wine dark:text-gold uppercase tracking-wider block mb-1">
                                    <i class="ph-bold ph-info"></i> Giới thiệu tác phẩm:
                                </span>
                                <p class="text-xs text-ink-muted dark:text-night-muted leading-relaxed">
                                    ${book.description || 'Tác phẩm chọn lọc thuộc kho tàng tri thức bản quyền số của HALM BOOK.'}
                                </p>
                            </div>
                            <p class="font-display font-semibold text-ink dark:text-night-text text-sm">Trích đoạn xem trước:</p>
                            <p>Chào mừng bạn đến với không gian đọc thử của <b>${book.bookName}</b>. Hệ thống HALM BOOK áp dụng tiêu chuẩn bảo vệ bản quyền số chuẩn quốc tế, cho phép bạn trải nghiệm trích đoạn nguyên bản với chất lượng dàn trang tối ưu.</p>
                            <p>Hãy bấm <b>"+ Thuê Cùng"</b> ngay trong giỏ hàng để mở khóa toàn bộ nội dung, tính năng ghi chú thông minh và đồng bộ hóa đa thiết bị với mức chiết khấu hội viên tốt nhất!</p>
                        </div>
                    `;
                }
            } else {
                openBookPreview('generic');
                return;
            }

            if (modal && dialog) {
                modal.classList.remove('opacity-0', 'pointer-events-none');
                dialog.classList.remove('scale-95');
                dialog.classList.add('scale-100');
            }
        }

        function updateRecommendationShelfStatus() {
            const cartBookIds = new Set(cartItems.map(i => String(i.bookId || i.id)));
            if (recommendedBooksCache && recommendedBooksCache.length > 0) {
                recommendedBooksCache.forEach(book => {
                    const bookId = String(book.book_id);
                    const actionWrapper = document.getElementById(`action-wrapper-${bookId}`);
                    if (actionWrapper) {
                        const isInCart = cartBookIds.has(bookId);
                        if (isInCart) {
                            actionWrapper.innerHTML = `
                                <button type="button" disabled class="w-full py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-metadata font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-default transition-all">
                                    <i class="ph-bold ph-check-circle text-xs"></i> <span>Đã Trong Giỏ</span>
                                </button>
                            `;
                        } else {
                            actionWrapper.innerHTML = `
                                <button type="button" onclick="window.handleQuickRentTogether('${bookId}')" id="btn-rent-${bookId}" class="w-full py-1.5 px-2 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer">
                                    <i class="ph-bold ph-plus-circle text-xs"></i> <span>+ Thuê Cùng</span>
                                </button>
                            `;
                        }
                    }
                });
            }
        }

        // Initialize on load
        const initializeCart = () => {
            initTheme();
            if (typeof renderRecommendedShelf === 'function') {
                renderRecommendedShelf(CURATED_TRENDING_BOOKS);
            }
            recalculateCart();
            fetchUserInfo();
            loadCartFromServer();
            loadRecommendations();
            const badge = document.getElementById('coupon-active-badge');
            if (badge) badge.classList.add('hidden');

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
        window.loadRecommendations = loadRecommendations;
        window.renderRecommendedShelf = renderRecommendedShelf;
        window.handleQuickRentTogether = handleQuickRentTogether;
        window.previewRecommendedBook = previewRecommendedBook;
        window.updateRecommendationShelfStatus = updateRecommendationShelfStatus;
    }, []);

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: cartStyles }} />
            <style dangerouslySetInnerHTML={{ __html: cartThemeStyles }} />
            <style>{inlinePageStyle1}</style>
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
                         MAIN CONTENT: TIÊU CHUẨN MAX-W 1520PX, ĐỒNG BỘ FONT INTER
                         ======================================================== */}
                    <main className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:pt-28 sm:pb-16 flex-1">
                
                        {/* Top Breadcrumb & Page Intro */}
                        <div className="mb-6 sm:mb-8 border-b border-paper-border dark:border-night-border pb-5">
                            {/* Breadcrumbs */}
                            <nav className="flex items-center gap-2 text-xs font-metadata text-ink-muted dark:text-night-muted mb-2">
                                <a href="/" className="hover:text-wine dark:hover:text-gold transition-colors">Trang Chủ</a>
                                <span>/</span>
                                <span className="text-ink dark:text-night-text font-bold">Giỏ Hàng & Thuê Sách</span>
                            </nav>
                
                            <h1 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-ink dark:text-night-text tracking-tight">
                                Giỏ Hàng Thuê Sách
                            </h1>
                        </div>
                
                
                        {/* ========================================================
                             CART MAIN LAYOUT: TWO-COLUMN ALIGNED AT BOOK 1
                             - Left Column (7 cols): Toolbar + Cart Items (when has items) OR Full-Height Empty Card (when empty)
                             - Right Column (5 cols): Wallet Balance Card + Checkout Summary Card
                             ======================================================== */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12">
                
                            {/* CỘT TRÁI: 7 CỘT */}
                            <div className="lg:col-span-7 flex flex-col justify-between">
                                {/* Khối hiển thị khi có sách trong giỏ: Thanh công cụ + Danh sách cuộn */}
                                <div id="cart-has-items-wrapper" className="space-y-4">
                                    <div id="cart-toolbar" className="p-3.5 sm:p-4 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-center justify-between gap-3">
                                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                                            <input type="checkbox" id="check-all" defaultChecked onChange={(event) => { window.toggleSelectAll(event.currentTarget.checked) }} className="luxury-checkbox" />
                                            <span className="font-display font-bold text-xs sm:text-sm text-ink dark:text-night-text whitespace-nowrap">
                                                Chọn tất cả (<span id="select-all-count">0</span>)
                                            </span>
                                        </label>
                    
                                        <button type="button" onClick={() => { window.deleteSelectedItems() }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-metadata font-bold transition-colors cursor-pointer">
                                            <i className="ph-bold ph-trash text-sm"></i>
                                            <span>Xóa mục đã chọn</span>
                                        </button>
                                    </div>

                                    {/* Khung cuộn giới hạn chiều cao tối đa (max-h) không làm đẩy nội dung bên dưới */}
                                    <div id="cart-items-scroll-wrapper" className="w-full max-h-[604px] pt-0.5 pb-2 overflow-y-auto overflow-x-hidden space-y-4 rounded-2xl">
                                        <div id="cart-items-container" className="space-y-4"></div>
                                    </div>
                                </div>
                
                                {/* Khối hiển thị khi giỏ hàng trống: Div màu be kéo rộng cao bằng khung chi tiết bên phải */}
                                <div id="cart-empty-state" className="hidden w-full h-full min-h-[480px] lg:min-h-[520px] py-14 px-8 rounded-2xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border text-center flex-col items-center justify-center space-y-6 shadow-sm transition-all">
                                    <div className="w-20 h-20 rounded-full bg-paper-200 dark:bg-night-surface mx-auto flex items-center justify-center text-ink-muted dark:text-night-muted text-3xl shadow-inner">
                                        <i className="ph-bold ph-shopping-bag-open"></i>
                                    </div>
                                    <div className="space-y-2.5 max-w-md mx-auto">
                                        <h3 className="font-display font-black text-2xl text-ink dark:text-night-text">Giỏ hàng của bạn đang trống</h3>
                                        <p className="font-editorial text-sm text-ink-muted dark:text-night-muted max-w-md mx-auto leading-relaxed">
                                            Hiện chưa có tác phẩm nào trong giỏ thuê. Hãy khám phá kho tàng sách phong phú của HALM ngay bên dưới!
                                        </p>
                                    </div>
                                    <a href="#trending-cart-shelf" onClick={(e) => { e.preventDefault(); document.getElementById('trending-cart-shelf')?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer">
                                        <span>Khám Phá Sách Mới</span>
                                        <i className="ph-bold ph-arrow-down"></i>
                                    </a>
                                </div>
                            </div>
                
                            {/* CỘT PHẢI: 5 CỘT (STICKY SUMMARY + VÍ KHOAI) */}
                            <div id="cart-summary-sidebar" className="lg:col-span-5 space-y-4 sticky top-24">
                                {/* Thẻ hiển thị số dư ví Khoai */}
                                <div id="cart-balance-card" className="p-3.5 sm:p-4 rounded-xl bg-paper-surface dark:bg-night-card border border-paper-border dark:border-night-border shadow-sm flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center text-sm shrink-0">
                                            <i className="ph-fill ph-wallet"></i>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-metadata uppercase tracking-wider font-bold text-ink-muted dark:text-night-muted">Số dư ví Khoai</div>
                                            <div className="font-metadata font-bold text-xs text-ink dark:text-night-text flex items-center gap-1">
                                                <span id="wallet-balance-display">0</span> Khoai
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(Khả dụng)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link to="/canhan?tab=wallet" className="px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold text-xs font-metadata font-bold transition-colors flex items-center gap-1">
                                        <span>Nạp thêm</span>
                                        <i className="ph-bold ph-plus text-[10px]"></i>
                                    </Link>
                                </div>
                                
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
                                            <span id="summary-items-count">0</span> sách
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
                                                <input type="text" id="coupon-input" placeholder="VD: VIPBOOK, KHOAI5" 
                                                       className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-metadata font-bold uppercase bg-paper-200/70 dark:bg-night-surface border border-paper-border dark:border-night-border focus:outline-none focus:border-wine dark:focus:border-gold text-ink dark:text-night-text placeholder-ink-muted/60 transition-colors" />
                                            </div>
                                            <button type="button" onClick={() => { window.applyCoupon() }} className="px-4 py-2 rounded-xl bg-paper-200 dark:bg-night-surface hover:bg-wine hover:text-white dark:hover:bg-gold dark:hover:text-night-bg border border-paper-border dark:border-night-border text-xs font-metadata font-bold text-ink dark:text-night-text transition-all">
                                                Áp Dụng
                                            </button>
                                        </div>
                                        <div id="coupon-active-badge" className="hidden flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs font-metadata text-emerald-700 dark:text-emerald-300">
                                            <span className="flex items-center gap-1.5 font-bold">
                                                <i className="ph-bold ph-seal-check"></i>
                                                <span id="coupon-name-text"></span> (-0 Khoai)
                                            </span>
                                            <button type="button" onClick={() => { window.removeCoupon() }} className="text-emerald-600 dark:text-emerald-400 hover:text-rose-500 transition-colors">
                                                <i className="ph-bold ph-x"></i>
                                            </button>
                                        </div>
                                    </div>
                
                                    {/* Cost Breakdown Details */}
                                    <div className="space-y-2.5 text-xs font-metadata border-t border-paper-border dark:border-night-border pt-4">
                                        <div className="flex items-center justify-between text-ink-muted dark:text-night-muted">
                                            <span>Tạm tính (<span id="subtotal-count-text">0</span> sách):</span>
                                            <span className="font-bold text-ink dark:text-night-text"><span id="summary-subtotal">0</span> Khoai</span>
                                        </div>
                                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                            <span>Ưu đãi giảm giá:</span>
                                            <span className="font-bold"><span id="summary-discount">0</span> Khoai</span>
                                        </div>
                                        <div className="flex items-center justify-between text-ink-muted dark:text-night-muted">
                                            <span>Phí cấp quyền tài liệu số:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Miễn phí</span>
                                        </div>
                                        <div className="flex items-center justify-between text-ink-muted dark:text-night-muted">
                                            <span id="summary-tier-label">Ưu đãi Hội Viên:</span>
                                            <span className="font-bold text-wine dark:text-gold" id="summary-tier-val">Đã kích hoạt</span>
                                        </div>
                                    </div>
                
                                    {/* Total Section */}
                                    <div className="border-t border-paper-border dark:border-night-border pt-4 space-y-1">
                                        <div className="flex items-baseline justify-between">
                                            <span className="font-display font-bold text-sm text-ink dark:text-night-text">Tổng Thanh Toán:</span>
                                            <div className="text-right">
                                                <span className="font-display font-black text-2xl sm:text-3xl text-wine dark:text-gold" id="summary-total">0</span>
                                                <span className="font-metadata font-bold text-xs uppercase text-gold ml-1">Khoai <i className="ph-fill ph-coins"></i></span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] font-metadata text-ink-muted dark:text-night-muted">
                                            <span>Số dư sau khi thanh toán:</span>
                                            <span className="font-bold text-emerald-600 dark:text-emerald-400"><span id="remaining-balance-display">0</span> Khoai</span>
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
                                <div className="w-full py-8 flex items-center justify-center gap-3 text-ink-muted dark:text-night-muted">
                                    <div className="w-5 h-5 rounded-full border-2 border-wine dark:border-gold border-t-transparent animate-spin"></div>
                                    <span className="text-xs font-metadata">Đang tải đề xuất sách phù hợp với bạn...</span>
                                </div>
                            </div>
                
                        </section>
                
                    </main>
                
                
                    {/* ========================================================
                         FOOTER: 5 CỘT SANG TRỌNG ĐỒNG BỘ TOÀN HỆ THỐNG
                         ======================================================== */}
                    
                
                
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
                                <a href="/tusachcn" className="flex-1 py-3 px-4 rounded-xl bg-wine hover:bg-wine-light text-white dark:bg-gold dark:hover:bg-gold-light dark:text-night-bg font-metadata font-bold text-xs uppercase tracking-wider shadow-md transition-all text-center">
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
