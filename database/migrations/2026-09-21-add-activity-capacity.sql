-- Activity capacity migration
-- Adds the maximum number of students an activity can accept.
SET @capacity_column_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'activity'
    AND COLUMN_NAME = 'capacity'
);
SET @sql := IF(@capacity_column_exists = 0,
  'ALTER TABLE activity ADD COLUMN capacity INT NOT NULL DEFAULT 30',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
