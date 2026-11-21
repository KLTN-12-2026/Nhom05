-- Shared offers, vouchers and cart quotes. Existing paid orders remain unchanged.
-- This migration is safe to run again. Local browser drafts are not imported as published offers.
CREATE TABLE IF NOT EXISTS book_offer (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    kind VARCHAR(16) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    image_url VARCHAR(2048),
    plan_key VARCHAR(16) NOT NULL,
    price_khoai INT NOT NULL,
    status VARCHAR(16) NOT NULL,
    start_date DATETIME(6),
    end_date DATETIME(6),
    order_index INT NOT NULL DEFAULT 0
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS book_offer_book (
    offer_id VARCHAR(64) NOT NULL,
    position_index INT NOT NULL,
    book_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (offer_id, position_index),
    UNIQUE KEY uk_offer_book (offer_id, book_id),
    CONSTRAINT fk_offer_book_offer FOREIGN KEY (offer_id) REFERENCES book_offer(id) ON DELETE CASCADE
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @offers_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cart' AND column_name = 'coupon_code') = 0,
    'ALTER TABLE cart ADD COLUMN coupon_code VARCHAR(100) NULL', 'SELECT 1');
PREPARE offers_stmt FROM @offers_ddl;
EXECUTE offers_stmt;
DEALLOCATE PREPARE offers_stmt;

SET @offers_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'cart_item' AND column_name = 'offer_id') = 0,
    'ALTER TABLE cart_item ADD COLUMN offer_id VARCHAR(64) NULL', 'SELECT 1');
PREPARE offers_stmt FROM @offers_ddl;
EXECUTE offers_stmt;
DEALLOCATE PREPARE offers_stmt;

SET @offers_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'order_item' AND column_name = 'offer_id') = 0,
    'ALTER TABLE order_item ADD COLUMN offer_id VARCHAR(64) NULL', 'SELECT 1');
PREPARE offers_stmt FROM @offers_ddl;
EXECUTE offers_stmt;
DEALLOCATE PREPARE offers_stmt;

SET @offers_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'checkout_offer_discount') = 0,
    'ALTER TABLE orders ADD COLUMN checkout_offer_discount DOUBLE NULL', 'SELECT 1');
PREPARE offers_stmt FROM @offers_ddl;
EXECUTE offers_stmt;
DEALLOCATE PREPARE offers_stmt;
