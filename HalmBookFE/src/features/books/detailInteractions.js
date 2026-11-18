import axiosInstance from '@/services/axiosClient';
import { isTokenValid } from '@/services/authToken';
import { openAuthModal } from '@/components/common/AuthModal';
import { createDomScope } from '@/utils/domScope';

export function createBookDetailInteractions({ book, bookId }) {
  const scope = createDomScope();
  const FLY_HEIGHT_RATIO = 0.72;
  const coverUrl = book?.img_url || book?.img || '/logo.png';
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
                scope.listen(themeToggleBtn, 'click', () => {
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
                scope.listen(bookCard, 'mousemove', (e) => {
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

                scope.listen(bookCard, 'mouseleave', () => {
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
                scope.requestAnimationFrame(() => {
                    scope.requestAnimationFrame(() => {
                        coverWrapper.style.transform = 'rotateY(0deg)'; // Gập đóng
                        pages.classList.remove('open-book-right-thickness');
                        coverBack.classList.remove('open-book-left-thickness');
                        const leftContent = coverBack.querySelector('#left-page-content');
                        if (leftContent) leftContent.style.opacity = '0';
                    });
                });

                // BƯỚC 2: Khi gập xong (0.85s), thu nhỏ sách bay về vị trí bìa sách và NỀN MỜ DẦN lộ diện giao diện chi tiết sách
                scope.setTimeout(() => {
                    if (bookCard) {
                        bookAnim.style.top = rect.top + 'px';
                        bookAnim.style.left = rect.left + 'px';
                        bookAnim.style.width = rect.width + 'px';
                        bookAnim.style.height = rect.height + 'px';
                        
                        // Làm trong suốt màn chắn để hiện trang Chi tiết sách
                        overlay.style.background = isDarkTheme ? 'rgba(17, 18, 16, 0)' : 'rgba(250, 247, 242, 0)';
                        
                        // BƯỚC 3: Dọn dẹp DOM và mở khóa cuộn trang
                        scope.setTimeout(() => {
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
                    scope.listen(star, 'mouseenter', () => {
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

                    scope.listen(star, 'click', () => {
                        ratingStars.setAttribute('data-rating', index + 1);
                        ratingFeedback.textContent = `${index + 1}/5 sao — ${feedbackTexts[index]}`;
                    });
                });

                scope.listen(ratingStars, 'mouseleave', () => {
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
                scope.listen(mobileMenuBtn, 'click', () => {
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
            scope.setTimeout(() => {
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
                scope.setTimeout(() => badge.classList.remove('scale-125'), 300);
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
                    durationDays: item.durationDays || item.days || (item.planKey === 'forever' ? 36500 : Number(item.planKey) || 7),
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
            scope.setTimeout(() => heart.classList.remove('scale-125'), 300);
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
            audioTimer = scope.setInterval(() => {
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
            } catch {
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
            } catch {}
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
            scope.setTimeout(() => {
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

            scope.requestAnimationFrame(() => {
                toast.classList.remove('translate-y-2', 'opacity-0');
            });

            scope.setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-2');
                scope.setTimeout(() => toast.remove(), 300);
            }, 3500);
        }
    


  return {
    createStars, openRentalModal, closeRentalModal, selectRentalModalPlan, confirmRentalModalAddToCart, scrollAuthorBooks, toggleCartDrawer, handleCheckoutCart, switchTab, showToast,
    dispose() {
      stopAudioTimer();
      stopSoftAmbientTone();
      scope.dispose();
      for (const [key, value] of Object.entries({openRentalModal, closeRentalModal, selectRentalModalPlan, confirmRentalModalAddToCart, addBuyForeverToCart, removeFromCart, postComment, likeComment, toggleReplyBox, cancelReply, submitReply})) {
        if (window[key] === value) delete window[key];
      }
    },
  };
}
