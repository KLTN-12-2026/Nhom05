-- Match the JPA Customer String ID length (255) without changing existing IDs.
-- Keep both the column and the table default compatible with the referenced Customer column.
SELECT CHARACTER_SET_NAME, COLLATION_NAME INTO @halm_parent_charset, @halm_parent_collation
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='customer' AND COLUMN_NAME='customer_id';

SET @halm_schema_sql = CONCAT('ALTER TABLE momo_topup_order DEFAULT CHARACTER SET ', @halm_parent_charset, ' COLLATE ', @halm_parent_collation);
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;

SELECT GROUP_CONCAT(DISTINCT CONCAT('DROP FOREIGN KEY `', REPLACE(CONSTRAINT_NAME, '`', '``'), '`, ') SEPARATOR '') INTO @halm_momo_fk_drop
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='momo_topup_order'
  AND COLUMN_NAME='customer_id' AND REFERENCED_TABLE_NAME='customer';

-- MySQL requires rebuilding this FK when VARCHAR grows across its storage-length boundary.
-- Do the column change and FK replacement together in one ALTER, keeping all payment rows.
SET @halm_momo_needs_alignment = EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='momo_topup_order' AND COLUMN_NAME='customer_id' AND (CHARACTER_MAXIMUM_LENGTH <> 255 OR COLLATION_NAME <> @halm_parent_collation)) OR @halm_momo_fk_drop IS NULL;
SET @halm_momo_replacement_fk = CONCAT('fk_momo_customer_', REPLACE(UUID(), '-', ''));
SET @halm_schema_sql = IF(@halm_momo_needs_alignment, CONCAT('ALTER TABLE momo_topup_order ', COALESCE(@halm_momo_fk_drop, ''), 'MODIFY COLUMN customer_id VARCHAR(255) CHARACTER SET ', @halm_parent_charset, ' COLLATE ', @halm_parent_collation, ' NOT NULL, ADD CONSTRAINT ', @halm_momo_replacement_fk, ' FOREIGN KEY (customer_id) REFERENCES customer(customer_id)'), 'SELECT 1');
PREPARE halm_schema_stmt FROM @halm_schema_sql;
EXECUTE halm_schema_stmt;
DEALLOCATE PREPARE halm_schema_stmt;
