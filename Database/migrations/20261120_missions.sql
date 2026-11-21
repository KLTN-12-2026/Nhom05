-- Apply to the existing application database. Existing claims remain valid.
-- Default missions are seeded only when the mission table is empty on backend startup.
CREATE TABLE IF NOT EXISTS mission (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(500) NOT NULL,
    condition_type VARCHAR(40) NOT NULL,
    period VARCHAR(20) NOT NULL,
    target_value INT NOT NULL,
    reward_potato INT NOT NULL,
    reward_xp INT NOT NULL,
    active BIT(1) NOT NULL DEFAULT b'1',
    order_index INT NOT NULL DEFAULT 0
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mission_activity (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    activity_date DATE,
    kind VARCHAR(40),
    progress_value INT NOT NULL DEFAULT 0,
    last_event_at TIMESTAMP(6) NULL,
    session_id VARCHAR(64),
    book_id VARCHAR(255)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @mission_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_mission_claim' AND column_name = 'claim_key') = 0,
    'ALTER TABLE user_mission_claim ADD COLUMN claim_key VARCHAR(64) NULL', 'SELECT 1');
PREPARE mission_stmt FROM @mission_ddl;
EXECUTE mission_stmt;
DEALLOCATE PREPARE mission_stmt;

SET @mission_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_mission_claim' AND column_name = 'reward_xp') = 0,
    'ALTER TABLE user_mission_claim ADD COLUMN reward_xp INT NULL', 'SELECT 1');
PREPARE mission_stmt FROM @mission_ddl;
EXECUTE mission_stmt;
DEALLOCATE PREPARE mission_stmt;

SET @mission_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_mission_claim' AND column_name = 'mission_title') = 0,
    'ALTER TABLE user_mission_claim ADD COLUMN mission_title VARCHAR(150) NULL', 'SELECT 1');
PREPARE mission_stmt FROM @mission_ddl;
EXECUTE mission_stmt;
DEALLOCATE PREPARE mission_stmt;

SET @mission_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_mission_claim' AND column_name = 'mission_period') = 0,
    'ALTER TABLE user_mission_claim ADD COLUMN mission_period VARCHAR(20) NULL', 'SELECT 1');
PREPARE mission_stmt FROM @mission_ddl;
EXECUTE mission_stmt;
DEALLOCATE PREPARE mission_stmt;

SET @mission_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'user_mission_claim' AND column_name = 'balance_after') = 0,
    'ALTER TABLE user_mission_claim ADD COLUMN balance_after INT NULL', 'SELECT 1');
PREPARE mission_stmt FROM @mission_ddl;
EXECUTE mission_stmt;
DEALLOCATE PREPARE mission_stmt;

SET @mission_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'user_mission_claim' AND index_name = 'uk_mission_claim_key') = 0,
    'CREATE UNIQUE INDEX uk_mission_claim_key ON user_mission_claim (claim_key)', 'SELECT 1');
PREPARE mission_stmt FROM @mission_ddl;
EXECUTE mission_stmt;
DEALLOCATE PREPARE mission_stmt;
