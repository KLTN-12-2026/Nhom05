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
const CURRENT_DB_SCHEMA_VERSION = 'api-backed-v1';

// Initial Seed Data
const DEFAULT_BOOKS = [
    {
        id: 'B001',
        title: 'Đợi Ngắn Đừng Ngủ Dài',
        author: 'Nguyễn Ngọc Thiện',
        category: 'Phát triển bản thân',
        format: 'PDF',
        fileSize: '14.2 MB',
        reads: 1420,
        status: 'public',
        isbn: 'ISBN-978-604-12-9842-1',
        coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        synopsis: 'Cuốn sách chia sẻ 101 bài học cuộc sống sâu sắc và thực tế từ một nhà tư tưởng lớn. Từng câu chữ nhắc nhở chúng ta sống trọn vẹn, không lãng phí thời gian vào những điều vụn vặt và dám bước ra khỏi vùng an toàn.',
        publisher: 'NXB Trẻ',
        publishYear: 2023,
        pages: 268,
        rating: 4.9,
        uploadDate: '2026-09-10',
        contentSample: [
            { chapter: 'Chương 1: Hãy là chính mình', text: 'Mỗi ngày bạn thức dậy là một cơ hội mới để bạn sống đúng với lý tưởng và đam mê của bản thân. Đừng để tiếng ồn từ quan điểm của người khác nhấn chìm tiếng nói sâu thẳm bên trong bạn. Hãy can đảm bước đi trên con đường của riêng mình.' },
            { chapter: 'Chương 2: Thói quen buổi sáng', text: 'Cách bạn bắt đầu một ngày sẽ định hình cách bạn sống một đời. Khi thức dậy lúc 5 giờ sáng, thế giới vẫn còn tĩnh lặng, đó là khoảng thời gian vàng để bạn suy ngẫm, đọc sách và rèn luyện thể chất.' },
            { chapter: 'Chương 3: Đừng sợ thất bại', text: 'Thất bại chỉ là bài học giá trị trên hành trình tiến tới thành công. Người không bao giờ vấp ngã là người chưa bao giờ dám thử làm điều gì mới mẻ.' }
        ]
    },
    {
        id: 'B002',
        title: 'Nhà Giả Kim (The Alchemist)',
        author: 'Paulo Coelho',
        category: 'Tiểu thuyết kinh điển',
        format: 'EPUB',
        fileSize: '8.6 MB',
        reads: 3890,
        status: 'public',
        isbn: 'ISBN-978-604-09-1120-4',
        coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
        synopsis: 'Câu chuyện kể về Santiago - chàng mục đồng xứ Andalusia quyết tâm lên đường đi tìm kho báu kim tự tháp Ai Cập theo điềm báo giấc mơ. Hành trình phiêu lưu giúp cậu hiểu được Tiếng nói của Vũ trụ và cách theo đuổi Vận Mệnh của đời mình.',
        publisher: 'NXB Văn Học',
        publishYear: 2022,
        pages: 224,
        rating: 5.0,
        uploadDate: '2026-09-05',
        contentSample: [
            { chapter: 'Khởi hành xứ Andalusia', text: 'Cậu bé tên là Santiago. Trời vừa chập tối khi cậu cùng đàn cừu đến một nhà thờ cổ hoang phế. Mái nhà thờ đã sập từ lâu và một cây tiêu khổng lồ mọc lên ngay chỗ trước kia là phòng thánh.' },
            { chapter: 'Gặp gỡ Vua Salem', text: 'Khi bạn thực sự khao khát một điều gì, toàn bộ vũ trụ sẽ đồng mưu để giúp bạn đạt được điều đó. Đó là chân lý vĩ đại nhất của hành tinh này.' }
        ]
    },
    {
        id: 'B003',
        title: 'Tư Duy Nhanh Và Chậm',
        author: 'Daniel Kahneman',
        category: 'Kinh tế & Kinh doanh',
        format: 'PDF',
        fileSize: '22.8 MB',
        reads: 2150,
        status: 'public',
        isbn: 'ISBN-978-604-56-3201-9',
        coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
        synopsis: 'Kiệt tác tâm lý học kinh tế chỉ ra hai hệ thống chi phối tư duy con người: Hệ thống 1 (nhanh, tự động, cảm tính) và Hệ thống 2 (chậm, đòi hỏi nỗ lực, logic). Sách giúp người đọc thấu hiểu các định kiến nhận thức và đưa ra quyết định sáng suốt hơn.',
        publisher: 'NXB Thế Giới',
        publishYear: 2021,
        pages: 610,
        rating: 4.8,
        uploadDate: '2026-08-18',
        contentSample: [
            { chapter: 'Hai hệ thống tư duy', text: 'Hệ thống 1 hoạt động tự động và nhanh chóng, với rất ít hoặc không có nỗ lực kiểm soát. Hệ thống 2 chú ý đến các hoạt động trí óc đòi hỏi nỗ lực, bao gồm các tính toán phức tạp.' }
        ]
    },
    {
        id: 'B004',
        title: 'Deep Learning & Trí Tuệ Nhân Tạo',
        author: 'Ian Goodfellow, Yoshua Bengio',
        category: 'Công nghệ & AI',
        format: 'PDF',
        fileSize: '36.5 MB',
        reads: 980,
        status: 'public',
        isbn: 'ISBN-978-604-88-7712-3',
        coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        synopsis: 'Giáo trình nền tảng sâu rộng về học sâu, mạng nơ-ron nhân tạo, mô hình sinh (GAN) và toán học ứng dụng cho kỹ sư và nhà nghiên cứu công nghệ hiện đại.',
        publisher: 'MIT Press & NXB Thông Tin',
        publishYear: 2024,
        pages: 780,
        rating: 4.9,
        uploadDate: '2026-09-28',
        contentSample: [
            { chapter: 'Giới thiệu mạng nơ-ron', text: 'Trí tuệ nhân tạo là ước mơ lâu đời của các nhà khoa học máy tính nhằm tạo ra cỗ máy có khả năng tư duy và tự học từ dữ liệu số lớn.' }
        ]
    },
    {
        id: 'B005',
        title: 'Tâm Lý Học Về Tiền',
        author: 'Morgan Housel',
        category: 'Kinh tế & Kinh doanh',
        format: 'EPUB',
        fileSize: '6.4 MB',
        reads: 3240,
        status: 'public',
        isbn: 'ISBN-978-604-33-4411-5',
        coverUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=600&q=80',
        synopsis: 'Làm tốt về tiền bạc không nhất thiết phụ thuộc vào bạn thông minh thế nào. Điều quan trọng hơn là cách bạn hành xử và quản lý tâm lý trước lòng tham và nỗi sợ.',
        publisher: 'NXB Dân Trí',
        publishYear: 2023,
        pages: 312,
        rating: 4.9,
        uploadDate: '2026-07-15',
        contentSample: [
            { chapter: 'Không ai điên rồ cả', text: 'Kinh nghiệm cá nhân của mỗi người về tiền có thể chiếm khoảng 0,00000001% những gì đã xảy ra trên thế giới, nhưng nó lại chiếm tới 80% cách bạn nghĩ thế giới vận hành.' }
        ]
    },
    {
        id: 'B006',
        title: 'Bản Đồ Tư Duy (Mind Map)',
        author: 'Tony Buzan',
        category: 'Phát triển bản thân',
        format: 'PDF',
        fileSize: '18.1 MB',
        reads: 1120,
        status: 'draft',
        isbn: 'ISBN-978-604-77-9912-0',
        coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
        synopsis: 'Công cụ tư duy phi tuyến tính giúp mở khóa tiềm năng não bộ, ghi nhớ siêu tốc và tổ chức công việc sáng tạo.',
        publisher: 'NXB Tổng Hợp',
        publishYear: 2024,
        pages: 250,
        rating: 4.6,
        uploadDate: '2026-10-01',
        contentSample: [
            { chapter: 'Khởi đầu với màu sắc và hình ảnh', text: 'Bộ não con người ghi nhớ bằng hình ảnh và các liên tưởng đa chiều tốt gấp ngàn lần những dòng chữ tuyến tính khô khan.' }
        ]
    }
];

const DEFAULT_USERS = [
    {
        id: 'U1001',
        name: 'Nguyễn Văn An',
        email: 'an.nguyen@gmail.com',
        phone: '0397409029',
        avatar: 'NA',
        tier: 'VIP Khoai Tây',
        status: 'active',
        balance: 650, // 650 củ khoai
        joinedDate: '2026-02-14',
        birthday: '1998-10-08',
        booksReadCount: 52,
        notifications: [
            {
                id: 'N01',
                title: 'Chào mừng thành viên VIP',
                message: 'Bạn đã kích hoạt thành công gói VIP Khoai Tây Tháng 10.',
                date: '2026-10-01 09:30',
                read: true,
                type: 'system'
            }
        ]
    },
    {
        id: 'U1002',
        name: 'Trần Thị Mai',
        email: 'mai.tran@gmail.com',
        phone: '0793503369',
        avatar: 'TM',
        tier: 'Standard',
        status: 'active',
        balance: 45,
        joinedDate: '2026-03-20',
        birthday: '2001-10-06', // Hôm nay sinh nhật!
        booksReadCount: 44,
        notifications: []
    },
    {
        id: 'U1003',
        name: 'Lê Hoàng Nam',
        email: 'nam.lehoang@yahoo.com',
        phone: '0908123456',
        avatar: 'HN',
        tier: 'VIP Khoai Tây',
        status: 'active',
        balance: 1200,
        joinedDate: '2026-01-10',
        birthday: '1995-11-20',
        booksReadCount: 39,
        notifications: []
    },
    {
        id: 'U1004',
        name: 'Phạm Minh Đức',
        email: 'duc.pham@outlook.com',
        phone: '0912345678',
        avatar: 'MD',
        tier: 'Standard',
        status: 'locked',
        balance: 0,
        joinedDate: '2026-05-12',
        birthday: '2000-04-15',
        booksReadCount: 12,
        notifications: [
            {
                id: 'N02',
                title: 'Tài khoản tạm khóa',
                message: 'Tài khoản của bạn tạm thời bị khóa do vi phạm chính sách cộng đồng.',
                date: '2026-09-20 11:00',
                read: false,
                type: 'warning'
            }
        ]
    },
    {
        id: 'U1005',
        name: 'Hoàng Kim Yến',
        email: 'yen.kimhoang@gmail.com',
        phone: '0938889999',
        avatar: 'KY',
        tier: 'VIP Khoai Tây',
        status: 'active',
        balance: 850,
        joinedDate: '2026-06-01',
        birthday: '1999-10-06', // Hôm nay sinh nhật!
        booksReadCount: 28,
        notifications: []
    }
];

const DEFAULT_TRANSACTIONS = [
    {
        id: 'TX-99821',
        code: '#TX-99821',
        userId: 'U1001',
        userName: 'Nguyễn Văn An',
        type: 'Nạp Gói Khoai Tây VIP',
        amount: 199000,
        potatoes: 500,
        status: 'pending',
        createdAt: '2026-10-06 18:45',
        method: 'Chuyển khoản QR Techcombank'
    },
    {
        id: 'TX-99820',
        code: '#TX-99820',
        userId: 'U1002',
        userName: 'Trần Thị Mai',
        type: 'Nạp Gói Khởi Động',
        amount: 49000,
        potatoes: 100,
        status: 'pending',
        createdAt: '2026-10-06 17:30',
        method: 'Ví MoMo'
    },
    {
        id: 'TX-99819',
        code: '#TX-99819',
        userId: 'U1003',
        userName: 'Lê Hoàng Nam',
        type: 'Nạp Gói Đại Gia Khoai Tây',
        amount: 499000,
        potatoes: 1500,
        status: 'approved',
        createdAt: '2026-10-06 14:10',
        method: 'VNPay QR'
    },
    {
        id: 'TX-99818',
        code: '#TX-99818',
        userId: 'U1005',
        userName: 'Hoàng Kim Yến',
        type: 'Nạp Gói VIP Tháng',
        amount: 199000,
        potatoes: 500,
        status: 'approved',
        createdAt: '2026-10-05 20:00',
        method: 'Chuyển khoản Vietcombank'
    }
];

const DEFAULT_RENTALS = [
    {
        id: 'RT-4481',
        code: '#RT-4481',
        userId: 'U1001',
        userName: 'Nguyễn Văn An',
        userEmail: 'an.nguyen@gmail.com',
        bookId: 'B001',
        bookTitle: 'Đợi Ngắn Đừng Ngủ Dài',
        bookCover: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
        duration: '30 ngày',
        costPotatoes: 50,
        status: 'active',
        startDate: '2026-10-01',
        endDate: '2026-10-31'
    },
    {
        id: 'RT-4482',
        code: '#RT-4482',
        userId: 'U1002',
        userName: 'Trần Thị Mai',
        userEmail: 'mai.tran@gmail.com',
        bookId: 'B002',
        bookTitle: 'Nhà Giả Kim (The Alchemist)',
        bookCover: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
        duration: '7 ngày',
        costPotatoes: 20,
        status: 'pending', // Đang chờ Admin duyệt kích hoạt
        startDate: '2026-10-06',
        endDate: '2026-10-13'
    },
    {
        id: 'RT-4483',
        code: '#RT-4483',
        userId: 'U1003',
        userName: 'Lê Hoàng Nam',
        userEmail: 'nam.lehoang@yahoo.com',
        bookId: 'B003',
        bookTitle: 'Tư Duy Nhanh Và Chậm',
        bookCover: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
        duration: 'Vĩnh viễn',
        costPotatoes: 150,
        status: 'active',
        startDate: '2026-09-15',
        endDate: 'Vô thời hạn'
    },
    {
        id: 'RT-4484',
        code: '#RT-4484',
        userId: 'U1005',
        userName: 'Hoàng Kim Yến',
        userEmail: 'yen.kimhoang@gmail.com',
        bookId: 'B005',
        bookTitle: 'Tâm Lý Học Về Tiền',
        bookCover: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=600&q=80',
        duration: '7 ngày',
        costPotatoes: 20,
        status: 'pending',
        startDate: '2026-10-06',
        endDate: '2026-10-13'
    }
];

const DEFAULT_TICKETS = [
    {
        id: 'TK-1024',
        code: '#TK-1024',
        userId: 'U1001',
        userName: 'Nguyễn Văn An',
        userEmail: 'an.nguyen@gmail.com',
        subject: 'Không tải được file EPUB trên ứng dụng máy tính bảng',
        message: 'Chào Admin, hôm nay tôi vào đọc cuốn Nhà Giả Kim nhưng ấn nút tải EPUB thì báo lỗi định dạng không tương thích. Nhờ Admin kiểm tra giúp tôi.',
        status: 'pending',
        createdAt: '2026-10-06 15:30',
        reply: '',
        repliedAt: '',
        repliedBy: ''
    },
    {
        id: 'TK-1023',
        code: '#TK-1023',
        userId: 'U1002',
        userName: 'Trần Thị Mai',
        userEmail: 'mai.tran@gmail.com',
        subject: 'Hỏi về ưu đãi nạp khoai tây ngày sinh nhật',
        message: 'Hôm nay sinh nhật tôi, không biết hệ thống có tặng mã ưu đãi nạp khoai tây hay sách miễn phí không ạ?',
        status: 'pending',
        createdAt: '2026-10-06 16:15',
        reply: '',
        repliedAt: '',
        repliedBy: ''
    },
    {
        id: 'TK-1022',
        code: '#TK-1022',
        userId: 'U1003',
        userName: 'Lê Hoàng Nam',
        userEmail: 'nam.lehoang@yahoo.com',
        subject: 'Cần hướng dẫn chuyển đổi gói VIP Khoai Tây thường niên',
        message: 'Tôi muốn nâng cấp lên gói đọc không giới hạn 1 năm, đã nạp chuyển khoản.',
        status: 'resolved',
        createdAt: '2026-10-05 10:20',
        reply: 'Chào bạn Nam, hệ thống đã ghi nhận giao dịch của bạn và kích hoạt thời hạn VIP 365 ngày thành công. Chúc bạn có những giờ đọc sách bổ ích!',
        repliedAt: '2026-10-05 11:05',
        repliedBy: 'Admin Tổng'
    }
];

const DEFAULT_PACKAGES = [
    { id: 'PKG-1', name: 'Gói Khởi Động', potatoes: 100, bonus: 10, price: 49000, tag: 'Cơ bản', desc: 'Thích hợp đọc thử thư giãn cuối tuần.' },
    { id: 'PKG-2', name: 'Gói VIP Tháng', potatoes: 500, bonus: 80, price: 199000, tag: 'Bán chạy nhất', desc: 'Đọc trọn vẹn kho sách độc quyền, tặng thêm 80 củ khoai.' },
    { id: 'PKG-3', name: 'Gói Đại Gia Khoai Tây', potatoes: 1500, bonus: 300, price: 499000, tag: 'Siêu hời', desc: 'Dành cho độc giả nghiên cứu chuyên sâu, đọc không giới hạn.' }
];

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
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch('http://localhost:8082/api/admin/books?page=0&size=1000', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error(`API sách trả về HTTP ${response.status}`);
            }
            const payload = await response.json();
            const books = Array.isArray(payload) ? payload : (payload.content || []);
            localStorage.setItem(DB_KEYS.BOOKS, JSON.stringify(books));
            this.emitChange();
        } catch (error) {
            console.error('Không thể tải dữ liệu sách quản trị từ API.', error);
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
            localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(txs));

            // Cập nhật số dư khoai tây hoặc VIP cho User
            let users = this.getUsers();
            const user = users.find(u => u.id === tx.userId);
            if (user) {
                user.balance = (user.balance || 0) + (tx.potatoes || 0);
                if (tx.type.includes('VIP')) {
                    user.tier = 'VIP Khoai Tây';
                }
                if (!user.notifications) user.notifications = [];
                user.notifications.unshift({
                    id: 'N_' + Date.now(),
                    title: '✅ Giao dịch đã được duyệt',
                    message: `Yêu cầu "${tx.type}" (${tx.amount.toLocaleString()} đ) đã được duyệt. Tài khoản bạn nhận thêm +${tx.potatoes} Củ Khoai!`,
                    date: new Date().toLocaleString('vi-VN'),
                    read: false,
                    type: 'finance'
                });
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            }
            this.emitChange();
            return tx;
        }
        return null;
    },
    rejectTransaction: function(id, reason = 'Thông tin giao dịch chưa trùng khớp') {
        let txs = this.getTransactions();
        const tx = txs.find(t => t.id === id || t.code === id);
        if (tx) {
            tx.status = 'rejected';
            localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(txs));

            // Báo cho User
            let users = this.getUsers();
            const user = users.find(u => u.id === tx.userId);
            if (user) {
                if (!user.notifications) user.notifications = [];
                user.notifications.unshift({
                    id: 'N_' + Date.now(),
                    title: '❌ Giao dịch bị từ chối',
                    message: `Giao dịch ${tx.code} đã bị từ chối. Lý do: ${reason}. Vui lòng liên hệ hỗ trợ.`,
                    date: new Date().toLocaleString('vi-VN'),
                    read: false,
                    type: 'finance_reject'
                });
                localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
            }
            this.emitChange();
            return tx;
        }
        return null;
    },
    createUserTransaction: function(txData) {
        let txs = this.getTransactions();
        const newTx = {
            id: 'TX-' + String(Math.floor(10000 + Math.random() * 90000)),
            code: '#TX-' + String(Math.floor(10000 + Math.random() * 90000)),
            userId: txData.userId,
            userName: txData.userName,
            type: txData.type || 'Nạp Khoai Tây',
            amount: Number(txData.amount),
            potatoes: Number(txData.potatoes),
            status: 'pending',
            createdAt: new Date().toLocaleString('vi-VN'),
            method: txData.method || 'Chuyển khoản QR'
        };
        txs.unshift(newTx);
        localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(txs));
        this.emitChange();
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
window.DB = DB;
