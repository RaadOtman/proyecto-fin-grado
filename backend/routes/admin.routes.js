const express   = require("express");
const pool      = require("../db");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Todas las rutas de este archivo requieren rol 'admin' (lo comprueba adminAuth)

// Recorta "HH:MM:SS" a "HH:MM"
function toHHMM(t) {
  return String(t || "").slice(0, 5);
}

// Convierte un Date de MySQL a string YYYY-MM-DD
function toDateStr(d) {
  if (d instanceof Date) return d.toISOString().split("T")[0];
  return String(d);
}

// ── GET /admin/stats ──────────────────────────────────────────
// Métricas para el dashboard: usuarios activos, reservas de hoy y totales
router.get("/stats", adminAuth, async (_req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [[{ usersTotal }]] = await pool.query(
      "SELECT COUNT(*) AS usersTotal FROM users WHERE is_active = 1"
    );
    const [[{ reservationsToday }]] = await pool.query(
      "SELECT COUNT(*) AS reservationsToday FROM reservations WHERE reservation_date = ? AND status = 'confirmed'",
      [today]
    );
    const [[{ reservationsTotal }]] = await pool.query(
      "SELECT COUNT(*) AS reservationsTotal FROM reservations WHERE status = 'confirmed'"
    );

    // Detalle de las reservas de hoy con el nombre de la pista y el email del usuario
    const [todayRows] = await pool.query(
      `SELECT r.id,
              r.court_id,
              c.name  AS court_name,
              r.start_time,
              u.email,
              u.name  AS user_name
       FROM   reservations r
       JOIN   users  u ON u.id = r.user_id
       JOIN   courts c ON c.id = r.court_id
       WHERE  r.reservation_date = ?
         AND  r.status = 'confirmed'
       ORDER  BY r.start_time ASC`,
      [today]
    );

    return res.json({
      ok: true,
      stats: { usersTotal, reservationsToday, reservationsTotal },
      todayReservations: todayRows.map((r) => ({
        ...r,
        start_time: toHHMM(r.start_time),
      })),
    });
  } catch (e) {
    console.error("ADMIN STATS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo estadísticas" });
  }
});

// ── GET /admin/users ──────────────────────────────────────────
// Lista todos los usuarios del sistema
router.get("/users", adminAuth, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, email, phone, role, is_active, created_at
       FROM   users
       ORDER  BY created_at DESC`
    );
    return res.json({ ok: true, users: rows });
  } catch (e) {
    console.error("ADMIN USERS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error listando usuarios" });
  }
});

// ── PATCH /admin/users/:id/role ───────────────────────────────
// Cambia el rol de un usuario entre 'user' y 'admin'
router.patch("/users/:id/role", adminAuth, async (req, res) => {
  try {
    const id   = Number(req.params.id);
    const role = req.body?.role;

    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ ok: false, error: "Rol inválido. Usa 'user' o 'admin'" });
    }
    // El admin no puede cambiar su propio rol para evitar que se quede sin acceso
    if (id === req.user.id) {
      return res.status(400).json({ ok: false, error: "No puedes cambiar tu propio rol" });
    }

    const [result] = await pool.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    return res.json({ ok: true, message: `Rol actualizado a '${role}'` });
  } catch (e) {
    console.error("ADMIN CHANGE ROLE ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error cambiando rol" });
  }
});

// ── PATCH /admin/users/:id/active ─────────────────────────────
// Activa o desactiva una cuenta (is_active: 1 activa, 0 desactivada)
router.patch("/users/:id/active", adminAuth, async (req, res) => {
  try {
    const id        = Number(req.params.id);
    const is_active = req.body?.is_active;

    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }
    if (is_active !== 0 && is_active !== 1) {
      return res.status(400).json({ ok: false, error: "is_active debe ser 0 o 1" });
    }
    if (id === req.user.id) {
      return res.status(400).json({ ok: false, error: "No puedes desactivar tu propia cuenta" });
    }

    const [result] = await pool.query(
      "UPDATE users SET is_active = ? WHERE id = ?",
      [is_active, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    const estado = is_active ? "activada" : "desactivada";
    return res.json({ ok: true, message: `Cuenta ${estado}` });
  } catch (e) {
    console.error("ADMIN TOGGLE ACTIVE ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error cambiando estado de la cuenta" });
  }
});

// ── DELETE /admin/users/:id ───────────────────────────────────
// Elimina un usuario permanentemente de la base de datos
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }
    if (id === req.user.id) {
      return res.status(400).json({ ok: false, error: "No puedes eliminarte a ti mismo" });
    }

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }

    return res.json({ ok: true, message: "Usuario eliminado" });
  } catch (e) {
    console.error("ADMIN DELETE USER ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error eliminando usuario" });
  }
});

// ── GET /admin/reservations ───────────────────────────────────
// Lista reservas con filtros opcionales por fecha, pista o estado
// Sin filtros devuelve las últimas 200
router.get("/reservations", adminAuth, async (req, res) => {
  try {
    const { reservation_date, court_id, status } = req.query;

    const conditions = [];
    const params     = [];

    if (reservation_date) {
      conditions.push("r.reservation_date = ?");
      params.push(reservation_date);
    }
    if (court_id) {
      conditions.push("r.court_id = ?");
      params.push(Number(court_id));
    }
    if (status) {
      conditions.push("r.status = ?");
      params.push(status);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const [rows] = await pool.query(
      `SELECT r.id,
              r.court_id,
              c.name   AS court_name,
              r.reservation_date,
              r.start_time,
              r.end_time,
              r.status,
              r.players_count,
              u.email,
              u.name   AS user_name
       FROM   reservations r
       JOIN   users  u ON u.id = r.user_id
       JOIN   courts c ON c.id = r.court_id
       ${where}
       ORDER  BY r.reservation_date DESC, r.start_time DESC
       LIMIT  200`,
      params
    );

    const reservations = rows.map((r) => ({
      ...r,
      reservation_date: toDateStr(r.reservation_date),
      start_time:       toHHMM(r.start_time),
      end_time:         toHHMM(r.end_time),
    }));

    return res.json({ ok: true, reservations });
  } catch (e) {
    console.error("ADMIN RESERVATIONS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error listando reservas" });
  }
});

// ── DELETE /admin/reservations/:id ────────────────────────────
// Cancela cualquier reserva desde el panel admin (soft delete)
router.delete("/reservations/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    const [result] = await pool.query(
      "UPDATE reservations SET status = 'cancelled' WHERE id = ? AND status != 'cancelled'",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Reserva no encontrada o ya cancelada" });
    }

    return res.json({ ok: true, message: "Reserva cancelada" });
  } catch (e) {
    console.error("ADMIN DELETE RESERVATION ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error cancelando reserva" });
  }
});

// ── GET /admin/courts ─────────────────────────────────────────
// Lista todas las pistas, incluyendo las inactivas y en mantenimiento
router.get("/courts", adminAuth, async (_req, res) => {
  try {
    const [courts] = await pool.query(
      "SELECT id, name, type, status, capacity, notes FROM courts ORDER BY id"
    );
    return res.json({ ok: true, courts });
  } catch (e) {
    console.error("ADMIN GET COURTS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error listando pistas" });
  }
});

// ── POST /admin/courts ────────────────────────────────────────
// Crea una pista nueva
router.post("/courts", adminAuth, async (req, res) => {
  try {
    const name     = String(req.body?.name     || "").trim();
    const type     = String(req.body?.type     || "").trim();
    const capacity = Number(req.body?.capacity) || 4;
    const notes    = String(req.body?.notes    || "").trim() || null;

    if (!name || !type) {
      return res.status(400).json({ ok: false, error: "name y type son obligatorios" });
    }
    if (!["Interior", "Exterior"].includes(type)) {
      return res.status(400).json({ ok: false, error: "type debe ser 'Interior' o 'Exterior'" });
    }

    const [result] = await pool.query(
      "INSERT INTO courts (name, type, capacity, notes) VALUES (?, ?, ?, ?)",
      [name, type, capacity, notes]
    );

    return res.status(201).json({ ok: true, courtId: result.insertId, message: "Pista creada" });
  } catch (e) {
    console.error("ADMIN CREATE COURT ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error creando pista" });
  }
});

// ── PUT /admin/courts/:id ─────────────────────────────────────
// Edita los datos de una pista existente
router.put("/courts/:id", adminAuth, async (req, res) => {
  try {
    const id       = Number(req.params.id);
    const name     = String(req.body?.name     || "").trim();
    const type     = String(req.body?.type     || "").trim();
    const capacity = Number(req.body?.capacity) || 4;
    const notes    = String(req.body?.notes    || "").trim() || null;

    if (!id || !name || !type) {
      return res.status(400).json({ ok: false, error: "id, name y type son obligatorios" });
    }
    if (!["Interior", "Exterior"].includes(type)) {
      return res.status(400).json({ ok: false, error: "type debe ser 'Interior' o 'Exterior'" });
    }

    const [result] = await pool.query(
      "UPDATE courts SET name = ?, type = ?, capacity = ?, notes = ? WHERE id = ?",
      [name, type, capacity, notes, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Pista no encontrada" });
    }

    return res.json({ ok: true, message: "Pista actualizada" });
  } catch (e) {
    console.error("ADMIN UPDATE COURT ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error actualizando pista" });
  }
});

// ── PATCH /admin/courts/:id/status ───────────────────────────
// Cambia el estado de una pista: 'active', 'inactive' o 'maintenance'
router.patch("/courts/:id/status", adminAuth, async (req, res) => {
  try {
    const id     = Number(req.params.id);
    const status = req.body?.status;

    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }
    if (!["active", "inactive", "maintenance"].includes(status)) {
      return res.status(400).json({
        ok: false,
        error: "Estado inválido. Usa 'active', 'inactive' o 'maintenance'",
      });
    }

    const [result] = await pool.query(
      "UPDATE courts SET status = ? WHERE id = ?",
      [status, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Pista no encontrada" });
    }

    return res.json({ ok: true, message: `Estado actualizado a '${status}'` });
  } catch (e) {
    console.error("ADMIN COURT STATUS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error cambiando estado de la pista" });
  }
});

// ── DELETE /admin/courts/:id ──────────────────────────────────
// Elimina una pista. No permite borrarla si tiene reservas futuras activas.
router.delete("/courts/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    // Comprobamos que no haya reservas confirmadas en el futuro para esta pista
    const [[{ n }]] = await pool.query(
      `SELECT COUNT(*) AS n FROM reservations
       WHERE court_id = ? AND status = 'confirmed' AND reservation_date >= CURDATE()`,
      [id]
    );
    if (n > 0) {
      return res.status(409).json({
        ok: false,
        error: `No se puede eliminar: la pista tiene ${n} reserva(s) futura(s) activa(s)`,
      });
    }

    const [result] = await pool.query("DELETE FROM courts WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Pista no encontrada" });
    }

    return res.json({ ok: true, message: "Pista eliminada" });
  } catch (e) {
    console.error("ADMIN DELETE COURT ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error eliminando pista" });
  }
});

module.exports = router;
