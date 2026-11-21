-- Apply to the existing application database before deploying broadcast notifications.
-- Existing notifications remain unchanged. Re-running this migration is safe.
CREATE TABLE IF NOT EXISTS notification_broadcast (
    request_id VARCHAR(36) NOT NULL PRIMARY KEY,
    admin_username VARCHAR(255) NOT NULL,
    fingerprint VARCHAR(64) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    target VARCHAR(16) NOT NULL,
    link VARCHAR(255) NOT NULL,
    sent_count INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @broadcast_column_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'notification' AND column_name = 'broadcast_id') = 0,
    'ALTER TABLE notification ADD COLUMN broadcast_id VARCHAR(36) NULL AFTER customer_id',
    'SELECT 1'
);
PREPARE broadcast_column_stmt FROM @broadcast_column_ddl;
EXECUTE broadcast_column_stmt;
DEALLOCATE PREPARE broadcast_column_stmt;

SET @broadcast_index_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'notification' AND index_name = 'uk_notification_broadcast_customer') = 0,
    'CREATE UNIQUE INDEX uk_notification_broadcast_customer ON notification (broadcast_id, customer_id)',
    'SELECT 1'
);
PREPARE broadcast_index_stmt FROM @broadcast_index_ddl;
EXECUTE broadcast_index_stmt;
DEALLOCATE PREPARE broadcast_index_stmt;
