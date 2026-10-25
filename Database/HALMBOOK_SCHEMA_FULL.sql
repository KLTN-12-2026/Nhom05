-- =============================================================================
-- HỆ THỐNG QUẢN LÝ & ĐỌC SÁCH TRỰC TUYẾN - HALMBOOK
-- DATABASE SCHEMA HOÀN CHỈNH (ĐÃ ĐỒNG BỘ TOÀN DIỆN VỚI BACKEND & FRONTEND)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS halmbook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE halmbook;

-- Tắt kiểm tra khóa ngoại tạm thời để tránh lỗi thứ tự nếu chạy script làm mới
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- 1. CÁC BẢNG ĐỘC LẬP / CẤU HÌNH BAN ĐẦU
-- =============================================================================

-- 1.1 Bảng Thể loại sách (Category)
DROP TABLE IF EXISTS category;
CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.2 Bảng Hạng thành viên độc giả (Membership Tier) - Đồng bộ HangTv.jsx
DROP TABLE IF EXISTS membership_tier;
CREATE TABLE membership_tier (
    tier_id INT AUTO_INCREMENT PRIMARY KEY,
    tier_name VARCHAR(100) NOT NULL,               -- 'Thợ Cày', 'Cao Thủ Cày', 'Lão Nông', 'Đại Điền Chủ'
    min_books_required INT DEFAULT 0,              -- 0, 10, 50, 150 cuốn
    min_potato_required INT DEFAULT 0,             -- Số khoai tích lũy yêu cầu
    discount_percent INT DEFAULT 0,                -- Giảm 0%, 5%, 10%, 20% phí thuê trọn đời
    badge_icon VARCHAR(100),                       -- Icon giao diện (ph-shield, ph-medal...)
    description VARCHAR(255)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.3 Bảng Gói nạp Khoai Tây (Potato Package) - Đồng bộ QLUuDaiVsGoi.jsx & ThanhToan.jsx
DROP TABLE IF EXISTS potato_package;
CREATE TABLE potato_package (
    package_id INT AUTO_INCREMENT PRIMARY KEY,
    package_name VARCHAR(255) NOT NULL,            -- 'Gói Khởi Động 🥔', 'Gói VIP Tháng 🥔'
    potato_amount INT NOT NULL,                    -- Số khoai gốc (100, 500, 1200)
    bonus_potato INT DEFAULT 0,                    -- Khoai thưởng kèm
    price_vnd DOUBLE NOT NULL,                     -- Giá bán bằng VND
    badge_tag VARCHAR(50),                         -- 'Bán chạy nhất', 'Ưu đãi HOT'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.4 Bảng Mã khuyến mãi / Giảm giá (Promotion)
DROP TABLE IF EXISTS promotion;
CREATE TABLE promotion (
    promotion_id VARCHAR(50) PRIMARY KEY,
    promotion_name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percent INT DEFAULT 0,
    discount_amount INT DEFAULT 0,
    start_date DATETIME,
    end_date DATETIME,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    category_id INT NULL,
    CONSTRAINT fk_promotion_category FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1.5 Bảng Sách điện tử (Book)
DROP TABLE IF EXISTS book;
CREATE TABLE book (
    book_id VARCHAR(50) PRIMARY KEY,
    book_name VARCHAR(255) NOT NULL,
    isbn VARCHAR(50) NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    year_of_publication INT,
    total_pages INT DEFAULT 0,
    rent_price DOUBLE NOT NULL DEFAULT 0.0,
    read_count INT DEFAULT 0,
    img_url VARCHAR(500) NOT NULL,                 -- URL ảnh bìa Cloudinary
    img_public_id VARCHAR(255) NULL,
    pdf_url VARCHAR(500) NOT NULL,                 -- URL file PDF đọc sách Cloudinary
    pdf_public_id VARCHAR(255) NULL,
    audio_url VARCHAR(500) NULL,                   -- URL Audio preview trích đọc
    file_format VARCHAR(20) DEFAULT 'PDF',
    file_size_mb DOUBLE DEFAULT 0.0,
    description TEXT,
    status VARCHAR(30) DEFAULT 'PUBLISHED',        -- 'PUBLISHED', 'DRAFT', 'HIDDEN'
    category_id INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_category FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- 2. TÀI KHOẢN, KHÁCH HÀNG & PHÂN HỆ NGƯỜI DÙNG
-- =============================================================================

-- 2.1 Bảng Tài khoản đăng nhập (Account)
DROP TABLE IF EXISTS account;
CREATE TABLE account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER', -- 'ROLE_USER', 'ROLE_ADMIN'
    provider VARCHAR(50) DEFAULT 'HALMBook',       -- 'HALMBook', 'GOOGLE', 'FACEBOOK'
    otp_code VARCHAR(10) NULL,
    otp_expiration DATETIME NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'            -- 'ACTIVE', 'LOCKED', 'BANNED'
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2.2 Bảng Khách hàng / Độc giả (Customer)
DROP TABLE IF EXISTS customer;
CREATE TABLE customer (
    customer_id VARCHAR(50) PRIMARY KEY,           -- Mã định dạng: id#C00001
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    address VARCHAR(255),
    avatar TEXT,
    avatar_url VARCHAR(500) DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=HalmBook',
    gender BIT(1) DEFAULT 0,
    birthday DATETIME,
    potato_balance INT DEFAULT 0,                  -- Số dư Khoai Tây hiện tại
    total_potato_earned INT DEFAULT 0,             -- Tổng khoai tích lũy xét cấp
    streak_days INT DEFAULT 0,                     -- Chuỗi ngày đọc sách liên tục
    last_streak_date DATE NULL,                    -- Ngày ghi nhận streak gần nhất
    tier_id INT NULL DEFAULT 1,                    -- Hạng thành viên liên kết
    account_id INT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_customer_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_tier FOREIGN KEY (tier_id) REFERENCES membership_tier(tier_id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2.3 Bảng Lịch sử biến động Khoai Tây (Potato Transaction)
DROP TABLE IF EXISTS potato_transaction;
CREATE TABLE potato_transaction (
    trans_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    amount INT NOT NULL,                           -- Số khoai (+10, -9, +500...)
    balance_after INT NOT NULL,                    -- Số dư sau giao dịch
    type VARCHAR(50) NOT NULL,                     -- 'TOPUP', 'RENT_BOOK', 'RENEW_BOOK', 'REWARD'
    description VARCHAR(255),                      -- 'Thuê sách: Ngày Xưa Có Một Chuyện Tình (7 ngày)'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_potato_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2.4 Bảng Trích dẫn & Bookmark trang sách (Reading Note & Bookmark)
DROP TABLE IF EXISTS reading_note_bookmark;
CREATE TABLE reading_note_bookmark (
    note_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    page_number INT NOT NULL,
    highlight_text TEXT,                           -- Đoạn văn trích dẫn lưu lại
    personal_note TEXT,                            -- Ghi chú của độc giả / AI Summary
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_note_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_note_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- 3. GIỎ HÀNG, ĐƠN HÀNG & QUYỀN ĐỌC SÁCH
-- =============================================================================

-- 3.1 Bảng Giỏ hàng (Cart)
DROP TABLE IF EXISTS cart;
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3.2 Bảng Chi tiết Giỏ hàng (Cart Item)
DROP TABLE IF EXISTS cart_item;
CREATE TABLE cart_item (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    plan_key VARCHAR(50) NULL,                     -- '1', '3', '7', 'forever'
    rental_days INT DEFAULT 7,                     -- Số ngày thuê
    selected_price DOUBLE DEFAULT 0.0,             -- Đơn giá tương ứng với gói
    CONSTRAINT fk_cartitem_cart FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cartitem_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3.3 Bảng Đơn hàng (Orders)
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
    orders_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    total_amount DOUBLE NOT NULL,
    discount_amount DOUBLE DEFAULT 0.0,
    payment_currency VARCHAR(10) DEFAULT 'VND',    -- 'VND' hoặc 'POTATO'
    order_type VARCHAR(30) DEFAULT 'RENT_BOOK',    -- 'RENT_BOOK', 'TOPUP_POTATO', 'BUY_BOOK'
    payment_status VARCHAR(50) DEFAULT 'PENDING',  -- 'PENDING', 'SUCCESS', 'FAILED'
    payment_method VARCHAR(50) DEFAULT 'VNPAY',    -- 'VNPAY', 'POTATO_WALLET'
    transaction_no VARCHAR(100),                   -- Mã giao dịch ngân hàng / cổng thanh toán
    promotion_id VARCHAR(50) NULL,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT,
    CONSTRAINT fk_orders_promotion FOREIGN KEY (promotion_id) REFERENCES promotion(promotion_id) ON DELETE SET NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3.4 Bảng Chi tiết Đơn hàng (Order Item)
DROP TABLE IF EXISTS order_item;
CREATE TABLE order_item (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    orders_id INT NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    price DOUBLE NOT NULL DEFAULT 0.0,
    duration_days INT DEFAULT 30,                  -- Thời hạn thuê
    rental_type VARCHAR(20) DEFAULT 'RENT',        -- 'RENT' hoặc 'BUY'
    CONSTRAINT fk_orderitem_orders FOREIGN KEY (orders_id) REFERENCES orders(orders_id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitem_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE RESTRICT
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3.5 Bảng Tủ sách cá nhân & Hồ sơ quyền truy cập đọc trực tuyến (Access Record)
DROP TABLE IF EXISTS access_record;
CREATE TABLE access_record (
    access_record_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME NOT NULL,                    -- Ngày hết hạn đọc sách
    status VARCHAR(50) DEFAULT 'ACTIVE',           -- 'ACTIVE', 'EXPIRED'
    current_page INT DEFAULT 1,                    -- Trang đang đọc dở
    reading_percentage DOUBLE DEFAULT 0.0,         -- Tiến độ % đọc hoàn thành
    last_read_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    renew_count INT DEFAULT 0,                     -- Số lần gia hạn thêm thời gian
    CONSTRAINT fk_access_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_access_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- 4. TƯƠNG TÁC ĐỘC GIẢ & TRỢ LÝ AI CHATBOT
-- =============================================================================

-- 4.1 Bảng Đánh giá & Bình luận sách (Evaluate)
DROP TABLE IF EXISTS evaluate;
CREATE TABLE evaluate (
    evaluate_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    star INT NOT NULL DEFAULT 5,                   -- Số sao đánh giá (1 -> 5)
    content TEXT,
    likes_count INT DEFAULT 0,                     -- Lượt thích bình luận
    parent_id INT NULL,                            -- ID bình luận cha (hỗ trợ reply phân cấp)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_evaluate_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluate_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE,
    CONSTRAINT fk_evaluate_parent FOREIGN KEY (parent_id) REFERENCES evaluate(evaluate_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4.2 Bảng Phiên hội thoại Chatbot (Chat Session)
DROP TABLE IF EXISTS chat_session;
CREATE TABLE chat_session (
    chat_session_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    start_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chatsession_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4.3 Bảng Tin nhắn Chatbot (Chat Message)
DROP TABLE IF EXISTS chat_message;
CREATE TABLE chat_message (
    chat_message_id INT AUTO_INCREMENT PRIMARY KEY,
    chat_session_id INT NOT NULL,
    sender VARCHAR(50) NOT NULL,                   -- 'USER', 'BOT', 'SYSTEM'
    content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chatmessage_session FOREIGN KEY (chat_session_id) REFERENCES chat_session(chat_session_id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bật lại kiểm tra khóa ngoại sau khi khởi tạo xong cấu trúc
SET FOREIGN_KEY_CHECKS = 1;
