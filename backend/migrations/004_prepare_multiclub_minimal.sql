-- Migracion 004 - Preparacion minima multi-club real
-- Objetivo:
--   - Crear un club por defecto sin borrar datos.
--   - Anadir club_id a courts y club_settings si no existe.
--   - Rellenar club_id en users, courts, reservations y club_settings.
--   - Reemplazar la constraint antigua de reservas por una alineada al schema actual.
--
-- Ejecutar una sola vez contra la base de datos actual. El script intenta ser
-- idempotente para poder repetirse en entornos donde alguna columna ya exista.

START TRANSACTION;

INSERT INTO clubs (name, city, address, description, image_url, maps_url, court_count)
SELECT 'PADEX Club', 'Sin ciudad', NULL, 'Club por defecto migrado para compatibilidad multi-club.', NULL, NULL, 0
WHERE NOT EXISTS (
  SELECT 1 FROM clubs WHERE name = 'PADEX Club' LIMIT 1
);

SET @default_club_id := (
  SELECT id FROM clubs
  WHERE name = 'PADEX Club'
  ORDER BY id ASC
  LIMIT 1
);

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE courts ADD COLUMN club_id INT NULL AFTER id',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'courts'
    AND COLUMN_NAME = 'club_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE club_settings ADD COLUMN club_id INT NULL AFTER id',
    'SELECT 1'
  )
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'club_settings'
    AND COLUMN_NAME = 'club_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users
SET club_id = @default_club_id
WHERE club_id IS NULL;

UPDATE courts
SET club_id = @default_club_id
WHERE club_id IS NULL;

UPDATE club_settings
SET club_id = @default_club_id
WHERE club_id IS NULL;

INSERT INTO club_settings (club_id, club_name, opening_time, closing_time, slot_minutes, max_days_ahead, cancel_hours_limit)
SELECT @default_club_id, 'PADEX Club', '09:00:00', '22:00:00', 90, 14, 12
WHERE NOT EXISTS (
  SELECT 1 FROM club_settings WHERE club_id = @default_club_id LIMIT 1
);

UPDATE reservations r
JOIN courts c ON c.id = r.court_id
SET r.club_id = c.club_id
WHERE r.club_id IS NULL;

UPDATE reservations r
JOIN users u ON u.id = r.user_id
SET r.club_id = u.club_id
WHERE r.club_id IS NULL;

UPDATE reservations
SET club_id = @default_club_id
WHERE club_id IS NULL;

UPDATE clubs c
LEFT JOIN (
  SELECT club_id, COUNT(*) AS total
  FROM courts
  GROUP BY club_id
) cc ON cc.club_id = c.id
SET c.court_count = COALESCE(cc.total, 0);

SET @sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE reservations DROP INDEX uq_reservation_slot',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND INDEX_NAME = 'uq_reservation_slot'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) > 0,
    'ALTER TABLE reservations DROP INDEX unique_slot',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND INDEX_NAME = 'unique_slot'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE reservations ADD CONSTRAINT uq_reservation_club_slot UNIQUE (club_id, court_id, reservation_date, start_time)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND INDEX_NAME = 'uq_reservation_club_slot'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX idx_users_club_id ON users (club_id)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'idx_users_club_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX idx_courts_club_id ON courts (club_id)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'courts'
    AND INDEX_NAME = 'idx_courts_club_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX idx_club_settings_club_id ON club_settings (club_id)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'club_settings'
    AND INDEX_NAME = 'idx_club_settings_club_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX idx_reservations_club_id ON reservations (club_id)',
    'SELECT 1'
  )
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'reservations'
    AND INDEX_NAME = 'idx_reservations_club_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

COMMIT;
