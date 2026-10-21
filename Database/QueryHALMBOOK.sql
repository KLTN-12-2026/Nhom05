-- 1. TẠO CƠ SỞ DỮ LIỆU
CREATE DATABASE IF NOT EXISTS ebook_online_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ebook_online_db;

-- 2. TẠO CÁC BẢNG (TABLES)

-- Bảng Thể loại (Category)
CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- Bảng Sách (Book) - Lưu URL thay vì file cứng
CREATE TABLE book (
    book_id VARCHAR(50) PRIMARY KEY,
    book_name VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    year_of_publication INT,
    rent_price DOUBLE NOT NULL DEFAULT 0.0,
    img_url VARCHAR(500) NOT NULL, -- Link ảnh bìa trên Cloudinary
    pdf_url VARCHAR(500) NOT NULL, -- Link file PDF trên Cloudinary
    description TEXT,
    category_id INT,
    CONSTRAINT fk_book_category FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Bảng Tài khoản (Account)
CREATE TABLE account (
    account_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'ROLE_CUSTOMER',
    otp_code VARCHAR(10),
    otp_expiration DATETIME
) ENGINE=InnoDB;

-- Bảng Khách hàng (Customer)
CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    address VARCHAR(255),
    birthday DATETIME,
    gender BIT(1),
    account_id INT UNIQUE,
    CONSTRAINT fk_customer_account FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng Giỏ hàng (Cart)
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL UNIQUE,
    CONSTRAINT fk_cart_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng Chi tiết Giỏ hàng (Cart Item)
CREATE TABLE cart_item (
    contain_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1, -- Mặc định là 1 vì là sách điện tử
    total DOUBLE NOT NULL DEFAULT 0.0,
    CONSTRAINT fk_cartitem_cart FOREIGN KEY (cart_id) REFERENCES cart(cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cartitem_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng Đơn hàng (Orders) - Lịch sử giao dịch VNPAY
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    total_amount DOUBLE NOT NULL,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50) DEFAULT 'PENDING',
    payment_method VARCHAR(50) DEFAULT 'VNPAY',
    transaction_no VARCHAR(100), -- Mã giao dịch VNPAY trả về
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Bảng Chi tiết Đơn hàng (Order Item)
CREATE TABLE order_item (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    price DOUBLE NOT NULL, -- Giá sách tại thời điểm thanh toán
    duration_days INT DEFAULT 30, -- Thời hạn thuê mặc định
    CONSTRAINT fk_orderitem_orders FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_orderitem_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Bảng Hồ sơ truy cập (Access Record) - CHÌA KHÓA CỦA HỆ THỐNG ONLINE
CREATE TABLE access_record (
    access_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME NOT NULL, -- Ngày hết hạn quyền đọc
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE hoặc EXPIRED
    CONSTRAINT fk_access_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_access_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng Đánh giá (Evaluate)
CREATE TABLE evaluate (
    evaluate_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    book_id VARCHAR(50) NOT NULL,
    star INT CHECK (star >= 1 AND star <= 5),
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_eval_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
    CONSTRAINT fk_eval_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng Phiên trò chuyện AI (Chat Session)
CREATE TABLE chat_session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Bảng Lịch sử tin nhắn AI (Chat Message) - Bộ nhớ cho Gemini
CREATE TABLE chat_message (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    sender VARCHAR(20) NOT NULL, -- Sẽ nhận giá trị 'USER' (Khách) hoặc 'MODEL' (Gemini)
    content TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_session FOREIGN KEY (session_id) REFERENCES chat_session(session_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE promotion (
    promotion_id VARCHAR(50) PRIMARY KEY, -- Mã nhập (Code), ví dụ: 'TET2026', 'GIAM20'
    promotion_name VARCHAR(255) NOT NULL, -- Tên chương trình
    description TEXT,
    discount_percent INT DEFAULT 0, -- Phần trăm giảm (0-100)
    discount_amount DOUBLE DEFAULT 0.0, -- Số tiền giảm trực tiếp
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    category_id INT, -- Tùy chọn: Chỉ giảm giá cho sách thuộc thể loại này
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, INACTIVE
    CONSTRAINT fk_promo_category FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL
) ENGINE=InnoDB;
