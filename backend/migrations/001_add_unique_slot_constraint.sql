-- Migración 001: Constraint UNIQUE para evitar doble reserva
-- Ejecutar UNA SOLA VEZ contra la base de datos padex_db
--
-- ANTES de ejecutar, verificar que no existan duplicados:
--   SELECT courtId, date, time, COUNT(*) as n
--   FROM reservations
--   GROUP BY courtId, date, time
--   HAVING n > 1;
--
-- Si hay duplicados, eliminarlos antes de aplicar este constraint.

ALTER TABLE reservations
  ADD CONSTRAINT unique_slot UNIQUE (courtId, date, time);
