-- One Book has many Promotions. The nullable FK is owned by promotion.book_id.
-- Preserve existing promotion values and match the parent ID's exact type and collation.
SELECT COLUMN_TYPE, CHARACTER_SET_NAME, COLLATION_NAME
INTO @halm_book_type, @halm_book_charset, @halm_book_collation
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='book' AND COLUMN_NAME='book_id';

SET @halm_schema_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='promotion' AND COLUMN_NAME='book_id'), 'SELECT 1', CONCAT('ALTER TABLE promotion ADD COLUMN book_id ', @halm_book_type, ' CHARACTER SET ', @halm_book_charset, ' COLLATE ', @halm_book_collation, ' NULL'));
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

SET @halm_schema_sql = IF(EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='promotion' AND COLUMN_NAME='book_id' AND (COLUMN_TYPE <> @halm_book_type OR COLLATION_NAME <> @halm_book_collation OR IS_NULLABLE <> 'YES')), CONCAT('ALTER TABLE promotion MODIFY COLUMN book_id ', @halm_book_type, ' CHARACTER SET ', @halm_book_charset, ' COLLATE ', @halm_book_collation, ' NULL'), 'SELECT 1');
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

-- Invalid existing book references cause this statement to fail; no rows are silently removed.
SET @halm_schema_sql = IF(EXISTS(SELECT 1 FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='promotion' AND COLUMN_NAME='book_id' AND REFERENCED_TABLE_NAME='book' AND REFERENCED_COLUMN_NAME='book_id'), 'SELECT 1', 'ALTER TABLE promotion ADD CONSTRAINT fk_promotion_book FOREIGN KEY (book_id) REFERENCES book(book_id) ON DELETE RESTRICT ON UPDATE RESTRICT');
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;
