-- Forward-only schema repair. No DELETE, DROP or seed data. Safe to re-run on MySQL 8.0.
SET @halm_schema_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cart_item' AND COLUMN_NAME='created_at'), 'SELECT 1', 'ALTER TABLE cart_item ADD COLUMN created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)');
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

SET @halm_schema_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cart_item' AND COLUMN_NAME='updated_at'), 'SELECT 1', 'ALTER TABLE cart_item ADD COLUMN updated_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)');
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

SET @halm_schema_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='topup_package_id'), 'SELECT 1', 'ALTER TABLE orders ADD COLUMN topup_package_id INT NULL');
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

SET @halm_schema_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='topup_package_name'), 'SELECT 1', 'ALTER TABLE orders ADD COLUMN topup_package_name VARCHAR(255) NULL');
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

SET @halm_schema_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='topup_potato_amount'), 'SELECT 1', 'ALTER TABLE orders ADD COLUMN topup_potato_amount INT NULL');
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

SELECT CHARACTER_SET_NAME, COLLATION_NAME INTO @halm_parent_charset, @halm_parent_collation FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='customer' AND COLUMN_NAME='customer_id';
SET @halm_schema_sql = CONCAT('CREATE TABLE IF NOT EXISTS momo_topup_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    request_id VARCHAR(50) NOT NULL,
    customer_id VARCHAR(255) CHARACTER SET ', @halm_parent_charset, ' COLLATE ', @halm_parent_collation, ' NOT NULL,
    package_id INT NOT NULL,
    package_name VARCHAR(120) NOT NULL,
    amount_vnd BIGINT NOT NULL,
    potato_amount INT NOT NULL,
    status ENUM(''PENDING'',''PAID'',''FAILED'') NOT NULL,
    gateway_transaction_id VARCHAR(80) NULL UNIQUE,
    created_at DATETIME(6) NOT NULL,
    paid_at DATETIME(6) NULL,
    CONSTRAINT uk_momo_topup_order_id UNIQUE (order_id),
    CONSTRAINT uk_momo_topup_request_id UNIQUE (request_id),
    INDEX idx_momo_topup_customer (customer_id),
    CONSTRAINT fk_momo_topup_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
) ENGINE=InnoDB CHARACTER SET ', @halm_parent_charset, ' COLLATE ', @halm_parent_collation);
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

-- Historical MoMo payments already credited to wallets need a financial receipt only.
-- This does not modify balances. Deterministic transaction numbers make repeated runs safe.
INSERT INTO orders (customer_id, total_amount, discount_amount, payment_currency, order_type, payment_status,
                    payment_method, transaction_no, order_date, topup_package_id, topup_package_name, topup_potato_amount)
SELECT m.customer_id, m.amount_vnd, 0, 'VND', 'TOPUP_POTATO', 'APPROVED', 'MOMO', CONCAT('MOMO-', m.order_id),
       COALESCE(m.paid_at, m.created_at), m.package_id, m.package_name, m.potato_amount
FROM momo_topup_order m
WHERE m.status = 'PAID'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE CONVERT(o.transaction_no USING utf8mb4) COLLATE utf8mb4_unicode_ci = CONVERT(CONCAT('MOMO-', m.order_id) USING utf8mb4) COLLATE utf8mb4_unicode_ci);
