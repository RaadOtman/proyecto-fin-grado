-- Migracion 005 - Branding de club y horario partido
-- Mantiene compatibilidad con el horario continuo actual.

START TRANSACTION;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE clubs ADD COLUMN logo_url VARCHAR(500) NULL AFTER description',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clubs' AND COLUMN_NAME = 'logo_url'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE clubs ADD COLUMN banner_url VARCHAR(500) NULL AFTER logo_url',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clubs' AND COLUMN_NAME = 'banner_url'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE clubs ADD COLUMN status ENUM(''active'', ''inactive'', ''suspended'') NOT NULL DEFAULT ''active'' AFTER court_count',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clubs' AND COLUMN_NAME = 'status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE club_settings ADD COLUMN schedule_mode ENUM(''continuous'', ''split'') NOT NULL DEFAULT ''continuous'' AFTER closing_time',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_settings' AND COLUMN_NAME = 'schedule_mode'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE club_settings ADD COLUMN opening_time_morning TIME NULL AFTER schedule_mode',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_settings' AND COLUMN_NAME = 'opening_time_morning'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE club_settings ADD COLUMN closing_time_morning TIME NULL AFTER opening_time_morning',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_settings' AND COLUMN_NAME = 'closing_time_morning'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE club_settings ADD COLUMN opening_time_evening TIME NULL AFTER closing_time_morning',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_settings' AND COLUMN_NAME = 'opening_time_evening'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE club_settings ADD COLUMN closing_time_evening TIME NULL AFTER opening_time_evening',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'club_settings' AND COLUMN_NAME = 'closing_time_evening'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE clubs
SET logo_url = COALESCE(logo_url, image_url),
    banner_url = COALESCE(banner_url, image_url)
WHERE image_url IS NOT NULL;

COMMIT;
