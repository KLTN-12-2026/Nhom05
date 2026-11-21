-- Run against the application's MySQL database before deploying platform-aware banners.
-- Existing records remain WEB. This script can be run repeatedly without deleting banners.
CREATE TABLE IF NOT EXISTS banners (
    banner_id VARCHAR(64) NOT NULL PRIMARY KEY,
    platform VARCHAR(8) NOT NULL DEFAULT 'WEB',
    layout_type VARCHAR(50),
    eyebrow VARCHAR(255),
    title VARCHAR(255),
    title_highlight VARCHAR(255),
    description LONGTEXT,
    action_text VARCHAR(100),
    action_link TEXT,
    icon VARCHAR(100),
    gradient TEXT,
    image_url LONGTEXT,
    image_mode VARCHAR(50),
    is_active BIT DEFAULT 1,
    order_index INT DEFAULT 0,
    extra_data_json LONGTEXT,
    created_at DATETIME(6),
    updated_at DATETIME(6),
    INDEX idx_banners_platform_active_order (platform, is_active, order_index)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET @banner_platform_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'banners' AND column_name = 'platform') = 0,
    'ALTER TABLE banners ADD COLUMN platform VARCHAR(8) NOT NULL DEFAULT ''WEB'' AFTER banner_id',
    'SELECT 1'
);
PREPARE banner_platform_stmt FROM @banner_platform_ddl;
EXECUTE banner_platform_stmt;
DEALLOCATE PREPARE banner_platform_stmt;

UPDATE banners SET platform = 'WEB' WHERE platform IS NULL OR TRIM(platform) = '';

SET @banner_index_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = 'banners' AND index_name = 'idx_banners_platform_active_order') = 0,
    'CREATE INDEX idx_banners_platform_active_order ON banners (platform, is_active, order_index)',
    'SELECT 1'
);
PREPARE banner_index_stmt FROM @banner_index_ddl;
EXECUTE banner_index_stmt;
DEALLOCATE PREPARE banner_index_stmt;
