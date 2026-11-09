/**
 * HALMBOOK - Central Database Engine (LocalStorage-backed)
 * Đảm bảo dữ liệu đồng nhất giữa User và Admin:
 * User thao tác -> DB lưu -> Admin xử lý -> DB cập nhật -> User nhận kết quả.
 */

const DB_KEYS = {
    BOOKS: 'halm_db_books',
    USERS: 'halm_db_users',
    TRANSACTIONS: 'halm_db_transactions',
    RENTALS: 'halm_db_rentals',
    TICKETS: 'halm_db_tickets',
    PACKAGES: 'halm_db_packages',
    CURRENT_USER: 'halm_current_user',
    SITE_SETTINGS: 'halm_site_settings',
    ADMIN_SESSION: 'halm_admin_session'
};
const DB_SCHEMA_VERSION = 'halm_db_schema_version';
const CURRENT_DB_SCHEMA_VERSION = 'clean-live-v1';

// Initial Seed Data (Trống - không dùng dữ liệu mẫu, sẵn sàng nạp dữ liệu thật)
const DEFAULT_BOOKS = [];
const DEFAULT_USERS = [];
const DEFAULT_TRANSACTIONS = [];
const DEFAULT_RENTALS = [];
const DEFAULT_TICKETS = [];
const DEFAULT_PACKAGES = [];

// Database Engine Object
const DB = {
    init: function() {
        if (localStorage.getItem(DB_SCHEMA_VERSION) !== CURRENT_DB_SCHEMA_VERSION) {
            Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
            localStorage.setItem(DB_SCHEMA_VERSION, CURRENT_DB_SCHEMA_VERSION);
        }
        Object.values(DB_KEYS).forEach(key => {
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify([]));
            }
        });
        this.loadBooksFromApi();
    },
    loadBooksFromApi: async function() {
        const token = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null) || (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
        if (!token) return;
        // Chỉ gọi API quản trị khi đang truy cập trang Quản Trị
        if (typeof window !== 'undefined' && window.location && window.location.pathname && !window.location.pathname.startsWith('/admin')) {
            return;
        }
        try {
            const response = await fetch('/api/admin/books?page=0&size=1000', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) {
                // Không phải quyền Admin, bỏ qua âm thầm
                return;
            }
            if (!response.ok) {
                return;
            }
            const payload = await response.json();
            const books = Array.isArray(payload) ? payload : (payload.content || []);
            localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(books));
            this.emitChange();
        } catch (error) {
            // Không spam console lỗi
        }
    },

    resetToDefault: function() {
        Object.values(DB_KEYS).forEach(key => localStorage.setItem(key, JSON.stringify([])));
        this.loadBooksFromApi();
        this.emitChange();
        this.notify('Đã làm mới dữ liệu quản trị từ hệ thống.', 'success');
    },
    // --- BOOKS ---
    getBooks: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.BOOKS) || '[]');
    },
    getBook: function(id) {
        const books = this.getBooks();
        return books.find(b => b.id === id);
    },
    saveBook: function(bookData) {
        let books = this.getBooks();
        if (bookData.id) {
            const index = books.findIndex(b => b.id === bookData.id);
            if (index !== -1) {
                books[index] = { ...books[index], ...bookData };
            } else {
                books.unshift(bookData);
            }
        } else {
            bookData.id = 'B' + String(Date.now()).slice(-4);
            bookData.reads = bookData.reads || 0;
            bookData.uploadDate = new Date().toISOString().split('T')[0];
            books.unshift(bookData);
        }
        localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(books));
        this.emitChange();
        return bookData;
    },
    deleteBook: function(id) {
        let books = this.getBooks();
        books = books.filter(b => b.id !== id);
        localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(books));
        this.emitChange();
    },

    // --- USERS ---
    getUsers: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.USERS) || '[]');
    },
    getUser: function(id) {
        const users = this.getUsers();
        return users.find(u => u.id === id);
    },
    saveUser: function(userData) {
        let users = this.getUsers();
        const index = users.findIndex(u => u.id === userData.id);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
        } else {
            users.push(userData);
        }
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
        this.emitChange();
    },
    toggleLockUser: function(id) {
        let users = this.getUsers();
        const user = users.find(u => u.id === id);
        if (user) {
            user.status = user.status === 'active' ? 'locked' : 'active';
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            this.emitChange();
            return user;
        }
        return null;
    },
    sendBirthdayGreeting: function(userId, giftPotatoes = 50, customMessage = '') {
        let users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.balance = (user.balance || 0) + Number(giftPotatoes);
            const msg = customMessage || `HALMBOOK chúc bạn sinh nhật vui vẻ, hạnh phúc và gặt hái nhiều thành công! Tặng bạn ${giftPotatoes} Củ Khoai Tây đọc sách thỏa thích! 🎂🎉`;
            if (!user.notifications) user.notifications = [];
            user.notifications.unshift({
                id: 'N_' + Date.now(),
                title: '🎂 Chúc Mừng Sinh Nhật Từ HALMBOOK Team!',
                message: msg,
                date: new Date().toLocaleString('vi-VN'),
                read: false,
                type: 'birthday'
            });
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            this.emitChange();
            return { user, giftPotatoes, msg };
        }
        return null;
    },
    sendSupportMessageToUser: function(userId, title, message) {
        let users = this.getUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            if (!user.notifications) user.notifications = [];
            user.notifications.unshift({
                id: 'N_' + Date.now(),
                title: title || '💬 Tin nhắn hỗ trợ từ Quản trị viên',
                message: message,
                date: new Date().toLocaleString('vi-VN'),
                read: false,
                type: 'support'
            });
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            this.emitChange();
            return true;
        }
        return false;
    },

    // --- TRANSACTIONS (FINANCE) ---
    getTransactions: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.TRANSACTIONS) || '[]');
    },
    approveTransaction: function(id) {
        let txs = this.getTransactions();
        const tx = txs.find(t => t.id === id || t.code === id);
        if (tx && tx.status === 'pending') {
            tx.status = 'approved';
            tx.approvedAt = new Date().toLocaleString('vi-VN');
            localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(txs));

            // Cập nhật số dư khoai tây hoặc VIP cho User trong halm_db_users
            let users = this.getUsers();
            let user = users.find(u => String(u.id) === String(tx.userId) || (tx.userEmail && u.email === tx.userEmail) || (tx.userName && u.name === tx.userName));
            if (user) {
                user.balance = (user.balance || 0) + (tx.potatoes || 0);
                if (tx.type && tx.type.includes('VIP')) {
                    user.tier = 'VIP Khoai Tây';
                }
                if (!user.notifications) user.notifications = [];
                user.notifications.unshift({
                    id: 'N_' + Date.now(),
                    title: '✅ Giao dịch nạp đã được duyệt',
                    message: `Yêu cầu "${tx.type}" (${tx.amount.toLocaleString()} đ) đã được Ban Quản Trị duyệt! Tài khoản bạn nhận thêm +${tx.potatoes} Củ Khoai.`,
                    date: new Date().toLocaleString('vi-VN'),
                    read: false,
                    type: 'finance'
                });
            } else if (tx.userId || tx.userName) {
                user = {
                    id: String(tx.userId || 'U' + Math.floor(1000 + Math.random() * 9000)),
                    name: tx.userName || 'Độc giả HALM',
                    email: tx.userEmail || '',
                    balance: Number(tx.potatoes || 0),
                    tier: tx.type && tx.type.includes('VIP') ? 'VIP Khoai Tây' : 'Thợ Cày 🌱',
                    status: 'active',
                    joinedDate: new Date().toISOString().slice(0, 10),
                    notifications: [
                        {
                            id: 'N_' + Date.now(),
                            title: '✅ Giao dịch nạp đã được duyệt',
                            message: `Yêu cầu "${tx.type}" (${tx.amount.toLocaleString()} đ) đã được Ban Quản Trị duyệt! Tài khoản bạn nhận thêm +${tx.potatoes} Củ Khoai.`,
                            date: new Date().toLocaleString('vi-VN'),
                            read: false,
                            type: 'finance'
                        }
                    ]
                };
                users.push(user);
            }
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

            // Cập nhật đồng bộ trực tiếp vào halm_customer_cache cho User UI
            let updatedBalance = null;
            try {
                const cached = localStorage.getItem('halm_customer_cache');
                if (cached) {
                    const custObj = JSON.parse(cached);
                    const isTargetCustomer = !tx.userId || 
                        String(custObj.customerId) === String(tx.userId) || 
                        String(custObj.id) === String(tx.userId) || 
                        custObj.customerName === tx.userName || 
                        (tx.userEmail && custObj.email === tx.userEmail);
                    if (isTargetCustomer) {
                        custObj.potatoBalance = (custObj.potatoBalance || 0) + (tx.potatoes || 0);
                        custObj.totalPotatoEarned = (custObj.totalPotatoEarned || custObj.potatoBalance) + (tx.potatoes || 0);
                        localStorage.setItem('halm_customer_cache', JSON.stringify(custObj));
                        updatedBalance = custObj.potatoBalance;
                    }
                }
            } catch (e) {
                console.warn("Lỗi đồng bộ halm_customer_cache:", e);
            }

            // Phát sự kiện toàn cục để Header, Cá Nhân, Giỏ Hàng... nhận số dư mới ngay lập tức
            window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                detail: {
                    potatoBalance: updatedBalance !== null ? updatedBalance : (user ? user.balance : undefined),
                    addedPotato: tx.potatoes,
                    txCode: tx.code,
                    txId: tx.id,
                    status: 'approved',
                    tx: tx
                }
            }));

            this.emitChange();
            return tx;
        }
        return null;
    },
    rejectTransaction: function(id, reason = 'Thông tin giao dịch chưa trùng khớp') {
        let txs = this.getTransactions();
        const tx = txs.find(t => t.id === id || t.code === id);
        if (tx && tx.status === 'pending') {
            tx.status = 'rejected';
            tx.rejectReason = reason;
            tx.rejectedAt = new Date().toLocaleString('vi-VN');
            localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(txs));

            // Báo cho User
            let users = this.getUsers();
            let user = users.find(u => String(u.id) === String(tx.userId) || (tx.userEmail && u.email === tx.userEmail) || (tx.userName && u.name === tx.userName));
            if (user) {
                if (!user.notifications) user.notifications = [];
                user.notifications.unshift({
                    id: 'N_' + Date.now(),
                    title: '❌ Giao dịch nạp bị từ chối',
                    message: `Giao dịch ${tx.code} đã bị từ chối. Lý do: ${reason}. Vui lòng liên hệ bộ phận hỗ trợ độc giả.`,
                    date: new Date().toLocaleString('vi-VN'),
                    read: false,
                    type: 'finance_reject'
                });
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            }

            // Phát sự kiện toàn cục thông báo từ chối
            window.dispatchEvent(new CustomEvent('halm-potato-updated', {
                detail: {
                    txCode: tx.code,
                    txId: tx.id,
                    status: 'rejected',
                    reason: reason,
                    tx: tx
                }
            }));

            this.emitChange();
            return tx;
        }
        return null;
    },
    createUserTransaction: function(txData) {
        let txs = this.getTransactions();
        const codeNum = Math.floor(10000 + Math.random() * 90000);
        const now = new Date();
        const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const newTx = {
            id: txData.id || ('TX-' + codeNum),
            code: txData.code || ('#TX-' + codeNum),
            userId: txData.userId,
            userName: txData.userName,
            userEmail: txData.userEmail || '',
            type: txData.type || 'Nạp Khoai Tây',
            amount: Number(txData.amount || 0),
            potatoes: Number(txData.potatoes || 0),
            status: 'pending',
            createdAt: txData.createdAt || formattedDate,
            method: txData.method || 'Chuyển khoản QR'
        };
        txs.unshift(newTx);
        localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(txs));

        // Tự động đồng bộ User vào DB nếu chưa có
        let users = this.getUsers();
        let user = users.find(u => String(u.id) === String(newTx.userId) || (newTx.userEmail && u.email === newTx.userEmail) || (newTx.userName && u.name === newTx.userName));
        if (!user && (newTx.userId || newTx.userName)) {
            user = {
                id: String(newTx.userId || 'U' + codeNum),
                name: newTx.userName || 'Độc giả HALM',
                email: newTx.userEmail || '',
                balance: 0,
                tier: 'Thợ Cày 🌱',
                status: 'active',
                joinedDate: new Date().toISOString().slice(0, 10),
                notifications: [
                    {
                        id: 'N_' + Date.now(),
                        title: '⏳ Giao dịch nạp đang chờ xét duyệt',
                        message: `Yêu cầu "${newTx.type}" (${newTx.amount.toLocaleString()} đ) đã được ghi nhận và đang chờ Admin duyệt.`,
                        date: formattedDate,
                        read: false,
                        type: 'finance_pending'
                    }
                ]
            };
            users.push(user);
            localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
        }

        this.emitChange();

        // Gửi thông báo nổi nếu Admin đang mở trang quản trị
        if (typeof this.notify === 'function') {
            this.notify(`📥 Giao dịch mới ${newTx.code} (${newTx.amount.toLocaleString()} đ) từ ${newTx.userName} đang chờ duyệt!`, 'info');
        }

        return newTx;
    },

    // --- RENTALS (GIAO DỊCH THUÊ SÁCH) ---
    getRentals: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.RENTALS) || '[]');
    },
    approveRental: function(id) {
        let rentals = this.getRentals();
        const rental = rentals.find(r => r.id === id || r.code === id);
        if (rental && rental.status === 'pending') {
            rental.status = 'active';
            localStorage.setItem(DB_KEYS.RENTALS, JSON.stringify(rentals));

            // Tăng lượt đọc của sách
            let books = this.getBooks();
            const book = books.find(b => b.id === rental.bookId);
            if (book) {
                book.reads = (book.reads || 0) + 1;
                localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(books));
            }

            // Gửi thông báo cho User
            let users = this.getUsers();
            const user = users.find(u => u.id === rental.userId);
            if (user) {
                user.booksReadCount = (user.booksReadCount || 0) + 1;
                if (!user.notifications) user.notifications = [];
                user.notifications.unshift({
                    id: 'N_' + Date.now(),
                    title: '📚 Yêu cầu thuê sách đã được duyệt!',
                    message: `Yêu cầu thuê cuốn "${rental.bookTitle}" (${rental.duration}) đã được Admin duyệt. Bạn có thể mở đọc ngay bây giờ!`,
                    date: new Date().toLocaleString('vi-VN'),
                    read: false,
                    type: 'rental_approved'
                });
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            }
            this.emitChange();
            return rental;
        }
        return null;
    },
    rejectRental: function(id, reason = 'Khoai tây không đủ hoặc sách đang bảo trì') {
        let rentals = this.getRentals();
        const rental = rentals.find(r => r.id === id || r.code === id);
        if (rental) {
            rental.status = 'rejected';
            localStorage.setItem(DB_KEYS.RENTALS, JSON.stringify(rentals));

            // Hoàn lại khoai tây cho user nếu đã trừ
            let users = this.getUsers();
            const user = users.find(u => u.id === rental.userId);
            if (user) {
                user.balance = (user.balance || 0) + (rental.costPotatoes || 0);
                if (!user.notifications) user.notifications = [];
                user.notifications.unshift({
                    id: 'N_' + Date.now(),
                    title: '⚠️ Thuê sách bị từ chối / Hoàn khoai',
                    message: `Yêu cầu thuê "${rental.bookTitle}" bị từ chối. Đã hoàn lại ${rental.costPotatoes} củ khoai. Lý do: ${reason}`,
                    date: new Date().toLocaleString('vi-VN'),
                    read: false,
                    type: 'rental_rejected'
                });
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            }
            this.emitChange();
            return rental;
        }
        return null;
    },
    revokeRental: function(id) {
        let rentals = this.getRentals();
        const rental = rentals.find(r => r.id === id || r.code === id);
        if (rental) {
            rental.status = 'revoked';
            localStorage.setItem(DB_KEYS.RENTALS, JSON.stringify(rentals));
            this.emitChange();
            return rental;
        }
        return null;
    },
    createRental: function(userId, bookId, duration = '7 ngày', costPotatoes = 20) {
        const user = this.getUser(userId);
        const book = this.getBook(bookId);
        if (!user || !book) return null;

        // Trừ củ khoai
        if (user.balance < costPotatoes) {
            return { error: 'Số dư Củ Khoai Tây không đủ! Vui lòng nạp thêm.' };
        }
        user.balance -= costPotatoes;
        this.saveUser(user);

        let rentals = this.getRentals();
        const now = new Date();
        const endDate = new Date(now);
        if (duration.includes('7')) endDate.setDate(now.getDate() + 7);
        else if (duration.includes('30')) endDate.setDate(now.getDate() + 30);
        else endDate.setFullYear(now.getFullYear() + 10);

        const newRental = {
            id: 'RT-' + String(Math.floor(1000 + Math.random() * 9000)),
            code: '#RT-' + String(Math.floor(1000 + Math.random() * 9000)),
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            bookId: book.id,
            bookTitle: book.title,
            bookCover: book.coverUrl,
            duration: duration,
            costPotatoes: costPotatoes,
            status: 'pending', // Chờ Admin duyệt
            startDate: now.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };

        rentals.unshift(newRental);
        localStorage.setItem(DB_KEYS.RENTALS, JSON.stringify(rentals));
        this.emitChange();
        return newRental;
    },

    // --- TICKETS (HỖ TRỢ) ---
    getTickets: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.TICKETS) || '[]');
    },
    createTicket: function(userId, subject, message) {
        const user = this.getUser(userId);
        if (!user) return null;

        let tickets = this.getTickets();
        const newTicket = {
            id: 'TK-' + String(Math.floor(1000 + Math.random() * 9000)),
            code: '#TK-' + String(Math.floor(1000 + Math.random() * 9000)),
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            subject: subject,
            message: message,
            status: 'pending',
            createdAt: new Date().toLocaleString('vi-VN'),
            reply: '',
            repliedAt: '',
            repliedBy: ''
        };
        tickets.unshift(newTicket);
        localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));
        this.emitChange();
        return newTicket;
    },
    replyTicket: function(ticketId, replyText, adminName = 'Admin Tổng') {
        let tickets = this.getTickets();
        const ticket = tickets.find(t => t.id === ticketId || t.code === ticketId);
        if (ticket) {
            ticket.status = 'resolved';
            ticket.reply = replyText;
            ticket.repliedAt = new Date().toLocaleString('vi-VN');
            ticket.repliedBy = adminName;
            localStorage.setItem(DB_KEYS.TICKETS, JSON.stringify(tickets));

            // Báo cho User
            let users = this.getUsers();
            const user = users.find(u => u.id === ticket.userId);
            if (user) {
                if (!user.notifications) user.notifications = [];
                user.notifications.unshift({
                    id: 'N_' + Date.now(),
                    title: `💬 Phản hồi cho yêu cầu: ${ticket.subject}`,
                    message: `${adminName}: "${replyText}" (Trạng thái: Đã giải quyết)`,
                    date: new Date().toLocaleString('vi-VN'),
                    read: false,
                    type: 'ticket_reply'
                });
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            }
            this.emitChange();
            return ticket;
        }
        return null;
    },

    // --- PACKAGES ---
    getPackages: function() {
        return JSON.parse(localStorage.getItem(DB_KEYS.PACKAGES) || '[]');
    },
    savePackage: function(pkg) {
        let pkgs = this.getPackages();
        if (pkg.id) {
            const idx = pkgs.findIndex(p => p.id === pkg.id);
            if (idx !== -1) pkgs[idx] = { ...pkgs[idx], ...pkg };
            else pkgs.push(pkg);
        } else {
            pkg.id = 'PKG-' + Date.now();
            pkgs.push(pkg);
        }
        localStorage.setItem(DB_KEYS.PACKAGES, JSON.stringify(pkgs));
        this.emitChange();
    },
    deletePackage: function(id) {
        let pkgs = this.getPackages();
        pkgs = pkgs.filter(p => p.id !== id);
        localStorage.setItem(DB_KEYS.PACKAGES, JSON.stringify(pkgs));
        this.emitChange();
    },

    // --- ACTIVE CURRENT USER (FOR USER PORTAL) ---
    getCurrentUser: function() {
        const u = JSON.parse(localStorage.getItem(DB_KEYS.CURRENT_USER));
        if (u) {
            // refresh from users table
            const fresh = this.getUser(u.id);
            if (fresh) {
                localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(fresh));
                return fresh;
            }
        }
        return null;
    },
    setCurrentUser: function(userId) {
        const u = this.getUser(userId);
        if (u) {
            localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(u));
            this.emitChange();
        }
    },

    // --- STATS OVERVIEW ---
    getStats: function() {
        const books = this.getBooks();
        const users = this.getUsers();
        const txs = this.getTransactions();
        const rentals = this.getRentals();
        const tickets = this.getTickets();

        const totalRevenue = txs
            .filter(t => t.status === 'approved')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalReads = books.reduce((sum, b) => sum + (b.reads || 0), 0);
        const vipUsers = users.filter(u => String(u.tier || '').includes('VIP')).length;
        const pendingTxs = txs.filter(t => t.status === 'pending').length;
        const pendingRentals = rentals.filter(r => r.status === 'pending').length;
        const pendingTickets = tickets.filter(t => t.status === 'pending').length;

        return {
            totalBooks: books.length,
            publicBooks: books.filter(b => b.status === 'public').length,
            totalUsers: users.length,
            vipUsers: vipUsers,
            totalRevenue: totalRevenue,
            totalReads: totalReads,
            pendingTxs: pendingTxs,
            pendingRentals: pendingRentals,
            pendingTickets: pendingTickets
        };
    },

    // --- EVENT / SYNC ---
    emitChange: function() {
        window.dispatchEvent(new Event('halm_db_updated'));
    },
    onUpdate: function(callback) {
        window.addEventListener('halm_db_updated', callback);
        window.addEventListener('storage', callback);
    },

    // --- NOTIFICATION UTILITY ---
    notify: function(msg, type = 'info') {
        if (typeof document === 'undefined' || typeof document.getElementById !== 'function' || typeof document.createElement !== 'function') return;
        let toast = document.getElementById('toastNotification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toastNotification';
            toast.className = 'fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl z-50 transform trangray-y-20 opacity-0 transition-all duration-300 flex items-center space-x-3 bold-border';
            document.body.appendChild(toast);
        }

        let icon = '<i class="fa-solid fa-circle-check text-blue-400 text-base"></i>';
        if (type === 'success') icon = '<i class="fa-solid fa-circle-check text-gray-400 text-base"></i>';
        else if (type === 'warning') icon = '<i class="fa-solid fa-triangle-exclamation text-gray-400 text-base"></i>';
        else if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation text-gray-400 text-base"></i>';

        toast.innerHTML = `${icon}<span class="text-xs font-bold">${msg}</span>`;
        toast.classList.remove('trangray-y-20', 'opacity-0');
        toast.classList.add('trangray-y-0', 'opacity-100');

        setTimeout(() => {
            toast.classList.remove('trangray-y-0', 'opacity-100');
            toast.classList.add('trangray-y-20', 'opacity-0');
        }, 3200);
    }
};

// Initialize DB on load
DB.init();

// Window global expose
if (typeof window !== 'undefined') {
    window.DB = DB;
}

export default DB;
export { DB };
