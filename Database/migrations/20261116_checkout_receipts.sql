-- Additive migration. Back up the database before applying. No user rows are deleted.
-- Existing duplicate transaction numbers must be reviewed before adding the unique index.
SELECT transaction_no, COUNT(*) AS duplicates FROM orders WHERE transaction_no IS NOT NULL GROUP BY transaction_no HAVING COUNT(*) > 1;

SET @halm_migration_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='checkout_subtotal'), 'SELECT 1', 'ALTER TABLE orders ADD COLUMN checkout_subtotal DOUBLE NULL');
PREPARE halm_migration_stmt FROM @halm_migration_sql;
EXECUTE halm_migration_stmt;
DEALLOCATE PREPARE halm_migration_stmt;

SET @halm_migration_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='checkout_tier_discount'), 'SELECT 1', 'ALTER TABLE orders ADD COLUMN checkout_tier_discount DOUBLE NULL');
PREPARE halm_migration_stmt FROM @halm_migration_sql;
EXECUTE halm_migration_stmt;
DEALLOCATE PREPARE halm_migration_stmt;

SET @halm_migration_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='checkout_coupon_discount'), 'SELECT 1', 'ALTER TABLE orders ADD COLUMN checkout_coupon_discount DOUBLE NULL');
PREPARE halm_migration_stmt FROM @halm_migration_sql;
EXECUTE halm_migration_stmt;
DEALLOCATE PREPARE halm_migration_stmt;

SET @halm_migration_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='checkout_fingerprint'), 'SELECT 1', 'ALTER TABLE orders ADD COLUMN checkout_fingerprint VARCHAR(64) NULL');
PREPARE halm_migration_stmt FROM @halm_migration_sql;
EXECUTE halm_migration_stmt;
DEALLOCATE PREPARE halm_migration_stmt;

SET @halm_migration_sql = IF(EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND COLUMN_NAME='transaction_no' AND NON_UNIQUE=0), 'SELECT 1', 'ALTER TABLE orders ADD UNIQUE INDEX uq_orders_transaction_no (transaction_no)');
PREPARE halm_migration_stmt FROM @halm_migration_sql;
EXECUTE halm_migration_stmt;
DEALLOCATE PREPARE halm_migration_stmt;
