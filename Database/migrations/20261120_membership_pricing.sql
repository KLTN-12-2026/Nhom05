-- Existing tiers, customers and paid orders are preserved.
-- Restart the backend after applying; it initializes only missing metadata and the initial price policy.
CREATE TABLE IF NOT EXISTS commerce_policy (
    id INT NOT NULL PRIMARY KEY,
    revision BIGINT NOT NULL,
    rental_plans_json TEXT NOT NULL,
    updated_at DATETIME(6)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @commerce_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'membership_tier' AND column_name = 'rank_order') = 0,
    'ALTER TABLE membership_tier ADD COLUMN rank_order INT NULL', 'SELECT 1');
PREPARE commerce_stmt FROM @commerce_ddl;
EXECUTE commerce_stmt;
DEALLOCATE PREPARE commerce_stmt;

SET @commerce_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'membership_tier' AND column_name = 'upgrade_reward') = 0,
    'ALTER TABLE membership_tier ADD COLUMN upgrade_reward INT NULL', 'SELECT 1');
PREPARE commerce_stmt FROM @commerce_ddl;
EXECUTE commerce_stmt;
DEALLOCATE PREPARE commerce_stmt;

SET @commerce_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'membership_tier' AND column_name = 'benefits_json') = 0,
    'ALTER TABLE membership_tier ADD COLUMN benefits_json TEXT NULL', 'SELECT 1');
PREPARE commerce_stmt FROM @commerce_ddl;
EXECUTE commerce_stmt;
DEALLOCATE PREPARE commerce_stmt;

SET @commerce_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'checkout_policy_revision') = 0,
    'ALTER TABLE orders ADD COLUMN checkout_policy_revision BIGINT NULL', 'SELECT 1');
PREPARE commerce_stmt FROM @commerce_ddl;
EXECUTE commerce_stmt;
DEALLOCATE PREPARE commerce_stmt;
