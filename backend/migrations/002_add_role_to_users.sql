-- Migración 002 — Añadir columna role a la tabla users
-- Ejecutar una sola vez contra la base de datos de producción y local

ALTER TABLE users
  ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

-- Para dar permisos de admin a un usuario concreto:
-- UPDATE users SET role = 'admin' WHERE email = 'tu@email.com';
