const express   = require("express");
const pool      = require("../db");
const adminAuth = require("../middleware/adminAuth");
const requireClubContext = require("../middleware/requireClubContext");

const router = express.Router();

// Todas las rutas de este archivo requieren rol 'admin' (lo comprueba adminAuth)
router.use(adminAuth, requireClubContext);

// Recorta "HH:MM:SS" a "HH:MM"
function toHHMM(t) {
  return String(t || "").slice(0, 5);
}

// Convierte un Date de MySQL a string YYYY-MM-DD
function toDateStr(d) {
  if (d instanceof Date) return d.toISOString().split("T")[0];
  return String(d);
}

function toHHMMOrNull(t) {
  return t ? String(t).slice(0, 5) : null;
}

function normalizeHHMM(value) {
  const raw = String(value || "").trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : "";
}

function isBefore(start, end) {
  return start && end && start < end;
}

function toDateOnly(d) {
  if (d instanceof Date) return d.toISOString().split("T")[0];
  return String(d || "").slice(0, 10);
}

function normalizeCourtType(type) {
  const value = String(type || "").trim().toLowerCase();
  if (value === "interior" || value === "indoor") return "Interior";
  if (value === "exterior" || value === "outdoor") return "Exterior";
  return "";
}

function normalizeCourtPayload(body) {
  const name = String(body?.name || "").trim();
  const type = normalizeCourtType(body?.type);
  const surface = String(body?.surface || "").trim() || null;
  const capacity = Number(body?.capacity) || 4;
  const basePriceRaw = body?.base_price ?? body?.basePrice;
  const basePrice = basePriceRaw === "" || basePriceRaw == null ? null : Number(basePriceRaw);
  const notes = String(body?.notes || "").trim() || null;

  return { name, type, surface, capacity, basePrice, notes };
}

function normalizeWhatsApp(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(raw)) return raw;
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+?\d{7,15}$/.test(digits)) {
    return `https://wa.me/${digits.replace(/^\+/, "")}`;
  }
  return "";
}

// ── GET /admin/club ───────────────────────────────────────────
// Devuelve el club asociado al admin autenticado
router.get("/club", async (req, res) => {
  try {
    const clubId = req.user.club_id;

    const [rows] = await pool.query(
      `SELECT id, name, city, address, description, logo_url, banner_url, image_url, maps_url, whatsapp_url, court_count, status, created_at
       FROM   clubs
       WHERE  id = ?
       LIMIT  1`,
      [clubId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Club no encontrado" });
    }

    return res.json({ ok: true, club: rows[0] });
  } catch (e) {
    console.error("ADMIN GET CLUB ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo el club" });
  }
});

// ── PUT /admin/club ───────────────────────────────────────────
// Actualiza el club asociado al admin autenticado
router.put("/club", async (req, res) => {
  try {
    const clubId = req.user.club_id;
    const name = String(req.body?.name || "").trim();
    const city = String(req.body?.city || "").trim();
    const address = String(req.body?.address || "").trim() || null;
    const description = String(req.body?.description || "").trim() || null;
    const imageUrl = String(req.body?.image_url || "").trim() || null;
    const logoUrl = String(req.body?.logo_url || "").trim() || null;
    const bannerUrl = String(req.body?.banner_url || "").trim() || null;
    const whatsappUrl = normalizeWhatsApp(req.body?.whatsapp_url || req.body?.whatsapp);
    const status = ["active", "inactive", "suspended"].includes(req.body?.status)
      ? req.body.status
      : "active";

    if (!name || !city) {
      return res.status(400).json({ ok: false, error: "Nombre y ciudad son obligatorios" });
    }
    if (whatsappUrl === "") {
      return res.status(400).json({ ok: false, error: "WhatsApp debe ser un número válido o un enlace de WhatsApp" });
    }

    const [result] = await pool.query(
      `UPDATE clubs
       SET name = ?, city = ?, address = ?, description = ?, logo_url = ?, banner_url = ?, image_url = ?, whatsapp_url = ?, status = ?
       WHERE id = ?`,
      [name, city, address, description, logoUrl, bannerUrl, imageUrl || bannerUrl || logoUrl, whatsappUrl, status, clubId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Club no encontrado" });
    }

    await pool.query(
      "UPDATE club_settings SET club_name = ? WHERE club_id = ?",
      [name, clubId]
    );

    const [rows] = await pool.query(
      `SELECT id, name, city, address, description, logo_url, banner_url, image_url, maps_url, whatsapp_url, court_count, status, created_at
       FROM   clubs
       WHERE  id = ?
       LIMIT  1`,
      [clubId]
    );

    return res.json({ ok: true, club: rows[0], message: "Club actualizado" });
  } catch (e) {
    console.error("ADMIN UPDATE CLUB ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error actualizando el club" });
  }
});

// ── GET /admin/settings ───────────────────────────────────────
// Devuelve la configuracion operativa del club autenticado
router.get("/settings", async (req, res) => {
  try {
    const clubId = req.user.club_id;
    const [rows] = await pool.query(
      `SELECT opening_time,
              closing_time,
              schedule_mode,
              opening_time_morning,
              closing_time_morning,
              opening_time_evening,
              closing_time_evening,
              slot_minutes,
              max_days_ahead,
              cancel_hours_limit
       FROM   club_settings
       WHERE  club_id = ?
       LIMIT  1`,
      [clubId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Ajustes del club no encontrados" });
    }

    const settings = rows[0];
    return res.json({
      ok: true,
      settings: {
        ...settings,
        opening_time: toHHMM(settings.opening_time),
        closing_time: toHHMM(settings.closing_time),
        opening_time_morning: toHHMMOrNull(settings.opening_time_morning),
        closing_time_morning: toHHMMOrNull(settings.closing_time_morning),
        opening_time_evening: toHHMMOrNull(settings.opening_time_evening),
        closing_time_evening: toHHMMOrNull(settings.closing_time_evening),
      },
    });
  } catch (e) {
    console.error("ADMIN GET SETTINGS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo ajustes" });
  }
});

// ── PUT /admin/settings ───────────────────────────────────────
// Actualiza la configuracion operativa del club autenticado
router.put("/settings", async (req, res) => {
  try {
    const clubId = req.user.club_id;
    const scheduleMode = req.body?.schedule_mode === "split" ? "split" : "continuous";
    const openingTime = normalizeHHMM(req.body?.opening_time);
    const closingTime = normalizeHHMM(req.body?.closing_time);
    const morningOpen = normalizeHHMM(req.body?.opening_time_morning);
    const morningClose = normalizeHHMM(req.body?.closing_time_morning);
    const eveningOpen = normalizeHHMM(req.body?.opening_time_evening);
    const eveningClose = normalizeHHMM(req.body?.closing_time_evening);
    const slotMinutes = Number(req.body?.slot_minutes) || 90;
    const maxDaysAhead = Number(req.body?.max_days_ahead) || 14;
    const cancelHoursLimit = Number(req.body?.cancel_hours_limit) || 12;

    if (![60, 90, 120].includes(slotMinutes)) {
      return res.status(400).json({ ok: false, error: "Duración de tramo inválida" });
    }
    if (maxDaysAhead < 1 || maxDaysAhead > 90) {
      return res.status(400).json({ ok: false, error: "La antelación debe estar entre 1 y 90 días" });
    }
    if (cancelHoursLimit < 0 || cancelHoursLimit > 168) {
      return res.status(400).json({ ok: false, error: "El límite de cancelación debe estar entre 0 y 168 horas" });
    }

    if (scheduleMode === "continuous" && !isBefore(openingTime, closingTime)) {
      return res.status(400).json({ ok: false, error: "La apertura debe ser anterior al cierre" });
    }
    if (scheduleMode === "split") {
      if (!isBefore(morningOpen, morningClose) || !isBefore(eveningOpen, eveningClose)) {
        return res.status(400).json({ ok: false, error: "Revisa las franjas de mañana y tarde" });
      }
      if (morningClose > eveningOpen) {
        return res.status(400).json({ ok: false, error: "La franja de tarde debe empezar después de cerrar por la mañana" });
      }
    }

    const [[club]] = await pool.query("SELECT name FROM clubs WHERE id = ? LIMIT 1", [clubId]);
    if (!club) {
      return res.status(404).json({ ok: false, error: "Club no encontrado" });
    }

    const effectiveOpening = scheduleMode === "split" ? morningOpen : openingTime;
    const effectiveClosing = scheduleMode === "split" ? eveningClose : closingTime;

    const [existing] = await pool.query("SELECT id FROM club_settings WHERE club_id = ? LIMIT 1", [clubId]);
    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO club_settings
           (club_id, club_name, opening_time, closing_time, schedule_mode, opening_time_morning, closing_time_morning,
            opening_time_evening, closing_time_evening, slot_minutes, max_days_ahead, cancel_hours_limit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clubId,
          club.name,
          `${effectiveOpening}:00`,
          `${effectiveClosing}:00`,
          scheduleMode,
          scheduleMode === "split" ? `${morningOpen}:00` : null,
          scheduleMode === "split" ? `${morningClose}:00` : null,
          scheduleMode === "split" ? `${eveningOpen}:00` : null,
          scheduleMode === "split" ? `${eveningClose}:00` : null,
          slotMinutes,
          maxDaysAhead,
          cancelHoursLimit,
        ]
      );
    } else {
      await pool.query(
        `UPDATE club_settings
         SET club_name = ?,
             opening_time = ?,
             closing_time = ?,
             schedule_mode = ?,
             opening_time_morning = ?,
             closing_time_morning = ?,
             opening_time_evening = ?,
             closing_time_evening = ?,
             slot_minutes = ?,
             max_days_ahead = ?,
             cancel_hours_limit = ?
         WHERE club_id = ?`,
        [
          club.name,
          `${effectiveOpening}:00`,
          `${effectiveClosing}:00`,
          scheduleMode,
          scheduleMode === "split" ? `${morningOpen}:00` : null,
          scheduleMode === "split" ? `${morningClose}:00` : null,
          scheduleMode === "split" ? `${eveningOpen}:00` : null,
          scheduleMode === "split" ? `${eveningClose}:00` : null,
          slotMinutes,
          maxDaysAhead,
          cancelHoursLimit,
          clubId,
        ]
      );
    }

    return res.json({ ok: true, message: "Ajustes actualizados" });
  } catch (e) {
    console.error("ADMIN UPDATE SETTINGS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error actualizando ajustes" });
  }
});

// ── GET /admin/stats ──────────────────────────────────────────
// Métricas para el dashboard: usuarios activos, reservas de hoy y totales
router.get("/stats", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const clubId = req.user.club_id;

    const [[{ usersTotal }]] = await pool.query(
      "SELECT COUNT(*) AS usersTotal FROM user_clubs WHERE status = 'active' AND club_id = ?",
      [clubId]
    );
    const [[{ reservationsToday }]] = await pool.query(
      "SELECT COUNT(*) AS reservationsToday FROM reservations WHERE club_id = ? AND reservation_date = ? AND status = 'confirmed'",
      [clubId, today]
    );
    const [[{ reservationsTotal }]] = await pool.query(
      "SELECT COUNT(*) AS reservationsTotal FROM reservations WHERE club_id = ? AND status = 'confirmed'",
      [clubId]
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
       JOIN   courts c ON c.id = r.court_id AND c.club_id = r.club_id
       WHERE  r.club_id = ?
         AND  r.reservation_date = ?
         AND  r.status = 'confirmed'
       ORDER  BY r.start_time ASC`,
      [clubId, today]
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
// Lista los usuarios asociados al club actual mediante user_clubs
router.get("/users", async (req, res) => {
  try {
    const clubId = req.user.club_id;
    const [rows] = await pool.query(
      `SELECT u.id,
              u.name,
              u.last_name,
              u.email,
              u.phone,
              u.game_level,
              u.preferred_side,
              u.avatar_url,
              u.instagram_url,
              u.linkedin_url,
              u.website_url,
              u.bio,
              u.role,
              u.is_active,
              u.created_at,
              uc.role_in_club,
              uc.status AS club_status,
              uc.joined_at,
              (
                SELECT COUNT(*)
                FROM reservations r
                WHERE r.user_id = u.id
                  AND r.club_id = uc.club_id
                  AND r.status = 'confirmed'
              ) AS reservations_count
       FROM   user_clubs uc
       JOIN   users u ON u.id = uc.user_id
       WHERE  uc.club_id = ?
       ORDER  BY uc.joined_at DESC`,
      [clubId]
    );
    return res.json({ ok: true, users: rows });
  } catch (e) {
    console.error("ADMIN USERS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error listando usuarios" });
  }
});

// ── PATCH /admin/users/:id/role ───────────────────────────────
// Cambia el rol del usuario dentro de este club. Mantiene users.role por compatibilidad.
router.patch("/users/:id/role", async (req, res) => {
  try {
    const id   = Number(req.params.id);
    const role = req.body?.role;
    const clubId = req.user.club_id;

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

    const roleInClub = role === "admin" ? "admin" : "member";
    const [result] = await pool.query(
      "UPDATE user_clubs SET role_in_club = ? WHERE user_id = ? AND club_id = ?",
      [roleInClub, id, clubId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }
    if (role === "admin") {
      await pool.query("UPDATE users SET role = 'admin' WHERE id = ?", [id]);
    } else {
      await pool.query(
        `UPDATE users u
         SET u.role = 'user'
         WHERE u.id = ?
           AND NOT EXISTS (
             SELECT 1 FROM user_clubs uc
             WHERE uc.user_id = u.id AND uc.role_in_club = 'admin'
           )`,
        [id]
      );
    }

    return res.json({ ok: true, message: `Rol actualizado a '${role}'` });
  } catch (e) {
    console.error("ADMIN CHANGE ROLE ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error cambiando rol" });
  }
});

// ── PATCH /admin/users/:id/active ─────────────────────────────
// Activa o bloquea la relacion del usuario con este club
router.patch("/users/:id/active", async (req, res) => {
  try {
    const id        = Number(req.params.id);
    const is_active = req.body?.is_active;
    const clubId = req.user.club_id;

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
      "UPDATE user_clubs SET status = ? WHERE user_id = ? AND club_id = ?",
      [is_active ? "active" : "blocked", id, clubId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }
    if (!is_active) {
      await pool.query("UPDATE users SET club_id = NULL WHERE id = ? AND club_id = ?", [id, clubId]);
    } else {
      await pool.query("UPDATE users SET club_id = COALESCE(club_id, ?) WHERE id = ?", [clubId, id]);
    }

    const estado = is_active ? "activada" : "bloqueada";
    return res.json({ ok: true, message: `Relación con el club ${estado}` });
  } catch (e) {
    console.error("ADMIN TOGGLE ACTIVE ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error cambiando estado de la cuenta" });
  }
});

// ── DELETE /admin/users/:id ───────────────────────────────────
// Elimina la relacion del usuario con el club actual, no la cuenta global
router.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const clubId = req.user.club_id;

    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }
    if (id === req.user.id) {
      return res.status(400).json({ ok: false, error: "No puedes eliminarte a ti mismo" });
    }

    const [result] = await pool.query("DELETE FROM user_clubs WHERE user_id = ? AND club_id = ?", [id, clubId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    }
    await pool.query("UPDATE users SET club_id = NULL WHERE id = ? AND club_id = ?", [id, clubId]);

    return res.json({ ok: true, message: "Usuario retirado del club" });
  } catch (e) {
    console.error("ADMIN DELETE USER ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error eliminando usuario" });
  }
});

// ── GET /admin/reservations ───────────────────────────────────
// Lista reservas con filtros opcionales por fecha, pista o estado
// Sin filtros devuelve las últimas 200
router.get("/reservations", async (req, res) => {
  try {
    const { reservation_date, court_id, status } = req.query;
    const clubId = req.user.club_id;

    const conditions = ["r.club_id = ?"];
    const params     = [clubId];

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

    const where = `WHERE ${conditions.join(" AND ")}`;

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
       JOIN   courts c ON c.id = r.court_id AND c.club_id = r.club_id
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
router.delete("/reservations/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const clubId = req.user.club_id;
    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    const [result] = await pool.query(
      "UPDATE reservations SET status = 'cancelled' WHERE id = ? AND club_id = ? AND status != 'cancelled'",
      [id, clubId]
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

// ── GET /admin/blocks ─────────────────────────────────────────
// Lista bloqueos de horarios del club
router.get("/blocks", async (req, res) => {
  try {
    const clubId = req.user.club_id;
    const { block_date, court_id, is_active } = req.query;

    const conditions = ["b.club_id = ?"];
    const params = [clubId];

    if (block_date) {
      conditions.push("b.block_date = ?");
      params.push(block_date);
    }
    if (court_id) {
      conditions.push("(b.court_id = ? OR b.court_id IS NULL)");
      params.push(Number(court_id));
    }
    if (is_active === "0" || is_active === "1") {
      conditions.push("b.is_active = ?");
      params.push(Number(is_active));
    }

    const [rows] = await pool.query(
      `SELECT b.id,
              b.club_id,
              b.court_id,
              c.name AS court_name,
              b.block_date,
              b.start_time,
              b.end_time,
              b.reason,
              b.block_type,
              b.is_active,
              b.created_at
       FROM   court_blocks b
       LEFT JOIN courts c ON c.id = b.court_id AND c.club_id = b.club_id
       WHERE  ${conditions.join(" AND ")}
       ORDER  BY b.block_date DESC, b.start_time ASC
       LIMIT  300`,
      params
    );

    const blocks = rows.map((b) => ({
      ...b,
      block_date: toDateOnly(b.block_date),
      start_time: toHHMM(b.start_time),
      end_time: toHHMM(b.end_time),
    }));

    return res.json({ ok: true, blocks });
  } catch (e) {
    console.error("ADMIN BLOCKS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error listando bloqueos" });
  }
});

async function validateBlockInput(req, res) {
  const clubId = req.user.club_id;
  const courtId = req.body?.court_id === null || req.body?.court_id === "" || req.body?.court_id === undefined
    ? null
    : Number(req.body.court_id);
  const blockDate = String(req.body?.block_date || "").trim();
  const startTime = normalizeHHMM(req.body?.start_time);
  const endTime = normalizeHHMM(req.body?.end_time);
  const reason = String(req.body?.reason || "").trim();
  const blockType = String(req.body?.block_type || "maintenance").trim();
  const isActive = req.body?.is_active === 0 || req.body?.is_active === false ? 0 : 1;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(blockDate)) {
    res.status(400).json({ ok: false, error: "Fecha inválida" });
    return null;
  }
  if (!isBefore(startTime, endTime)) {
    res.status(400).json({ ok: false, error: "La hora de inicio debe ser anterior a la de fin" });
    return null;
  }
  if (!reason) {
    res.status(400).json({ ok: false, error: "El motivo es obligatorio" });
    return null;
  }
  if (!["maintenance", "event", "closure", "internal"].includes(blockType)) {
    res.status(400).json({ ok: false, error: "Tipo de bloqueo inválido" });
    return null;
  }

  if (courtId !== null) {
    const [courts] = await pool.query(
      "SELECT id FROM courts WHERE id = ? AND club_id = ? LIMIT 1",
      [courtId, clubId]
    );
    if (courts.length === 0) {
      res.status(404).json({ ok: false, error: "Pista no encontrada" });
      return null;
    }
  }

  return { clubId, courtId, blockDate, startTime, endTime, reason, blockType, isActive };
}

async function hasBlockOverlap(input, excludeId = null) {
  const params = [
    input.clubId,
    input.blockDate,
    input.endTime,
    input.startTime,
  ];
  const exclude = excludeId ? "AND id != ?" : "";
  if (excludeId) params.push(excludeId);

  const [rows] = await pool.query(
    `SELECT id FROM court_blocks
     WHERE club_id = ?
       AND block_date = ?
       AND is_active = 1
       AND start_time < ?
       AND end_time > ?
       ${exclude}
       AND (
         court_id IS NULL
         OR ? IS NULL
         OR court_id = ?
       )
     LIMIT 1`,
    [...params, input.courtId, input.courtId]
  );
  return rows.length > 0;
}

// ── POST /admin/blocks ────────────────────────────────────────
router.post("/blocks", async (req, res) => {
  try {
    const input = await validateBlockInput(req, res);
    if (!input) return;

    if (input.isActive && await hasBlockOverlap(input)) {
      return res.status(409).json({ ok: false, error: "Ya existe un bloqueo activo que solapa con ese horario" });
    }

    const [result] = await pool.query(
      `INSERT INTO court_blocks
         (club_id, court_id, block_date, start_time, end_time, reason, block_type, is_active, created_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.clubId,
        input.courtId,
        input.blockDate,
        input.startTime,
        input.endTime,
        input.reason,
        input.blockType,
        input.isActive,
        req.user.id,
      ]
    );

    return res.status(201).json({ ok: true, blockId: result.insertId, message: "Bloqueo creado" });
  } catch (e) {
    console.error("ADMIN CREATE BLOCK ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error creando bloqueo" });
  }
});

// ── PUT /admin/blocks/:id ─────────────────────────────────────
router.put("/blocks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "ID inválido" });

    const input = await validateBlockInput(req, res);
    if (!input) return;

    if (input.isActive && await hasBlockOverlap(input, id)) {
      return res.status(409).json({ ok: false, error: "Ya existe un bloqueo activo que solapa con ese horario" });
    }

    const [result] = await pool.query(
      `UPDATE court_blocks
       SET court_id = ?, block_date = ?, start_time = ?, end_time = ?, reason = ?, block_type = ?, is_active = ?
       WHERE id = ? AND club_id = ?`,
      [input.courtId, input.blockDate, input.startTime, input.endTime, input.reason, input.blockType, input.isActive, id, input.clubId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Bloqueo no encontrado" });
    }

    return res.json({ ok: true, message: "Bloqueo actualizado" });
  } catch (e) {
    console.error("ADMIN UPDATE BLOCK ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error actualizando bloqueo" });
  }
});

// ── DELETE /admin/blocks/:id ──────────────────────────────────
router.delete("/blocks/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ ok: false, error: "ID inválido" });

    const [result] = await pool.query(
      "UPDATE court_blocks SET is_active = 0 WHERE id = ? AND club_id = ?",
      [id, req.user.club_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Bloqueo no encontrado" });
    }

    return res.json({ ok: true, message: "Bloqueo desactivado" });
  } catch (e) {
    console.error("ADMIN DELETE BLOCK ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error desactivando bloqueo" });
  }
});

// ── GET /admin/courts ─────────────────────────────────────────
// Lista todas las pistas, incluyendo las inactivas y en mantenimiento
router.get("/courts", async (req, res) => {
  try {
    const clubId = req.user.club_id;
    const [courts] = await pool.query(
      "SELECT id, name, type, surface, status, capacity, base_price, notes FROM courts WHERE club_id = ? ORDER BY id",
      [clubId]
    );
    return res.json({ ok: true, courts });
  } catch (e) {
    console.error("ADMIN GET COURTS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error listando pistas" });
  }
});

// ── POST /admin/courts ────────────────────────────────────────
// Crea una pista nueva
router.post("/courts", async (req, res) => {
  try {
    const { name, type, surface, capacity, basePrice, notes } = normalizeCourtPayload(req.body);
    const clubId   = req.user.club_id;

    if (!name || !type) {
      return res.status(400).json({ ok: false, error: "name y type son obligatorios" });
    }
    if (capacity < 1 || capacity > 20) {
      return res.status(400).json({ ok: false, error: "La capacidad debe estar entre 1 y 20" });
    }
    if (basePrice !== null && (Number.isNaN(basePrice) || basePrice < 0)) {
      return res.status(400).json({ ok: false, error: "El precio base debe ser un número positivo" });
    }

    const [result] = await pool.query(
      "INSERT INTO courts (club_id, name, type, surface, capacity, base_price, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [clubId, name, type, surface, capacity, basePrice, notes]
    );

    await pool.query(
      "UPDATE clubs SET court_count = (SELECT COUNT(*) FROM courts WHERE club_id = ?) WHERE id = ?",
      [clubId, clubId]
    );

    return res.status(201).json({ ok: true, courtId: result.insertId, message: "Pista creada" });
  } catch (e) {
    console.error("ADMIN CREATE COURT ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error creando pista" });
  }
});

// ── PUT /admin/courts/:id ─────────────────────────────────────
// Edita los datos de una pista existente
router.put("/courts/:id", async (req, res) => {
  try {
    const id       = Number(req.params.id);
    const { name, type, surface, capacity, basePrice, notes } = normalizeCourtPayload(req.body);
    const clubId   = req.user.club_id;

    if (!id || !name || !type) {
      return res.status(400).json({ ok: false, error: "id, name y type son obligatorios" });
    }
    if (capacity < 1 || capacity > 20) {
      return res.status(400).json({ ok: false, error: "La capacidad debe estar entre 1 y 20" });
    }
    if (basePrice !== null && (Number.isNaN(basePrice) || basePrice < 0)) {
      return res.status(400).json({ ok: false, error: "El precio base debe ser un número positivo" });
    }

    const [result] = await pool.query(
      "UPDATE courts SET name = ?, type = ?, surface = ?, capacity = ?, base_price = ?, notes = ? WHERE id = ? AND club_id = ?",
      [name, type, surface, capacity, basePrice, notes, id, clubId]
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
router.patch("/courts/:id/status", async (req, res) => {
  try {
    const id     = Number(req.params.id);
    const status = req.body?.status;
    const clubId = req.user.club_id;

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
      "UPDATE courts SET status = ? WHERE id = ? AND club_id = ?",
      [status, id, clubId]
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
router.delete("/courts/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const clubId = req.user.club_id;
    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    // Comprobamos que no haya reservas confirmadas en el futuro para esta pista
    const [[{ n }]] = await pool.query(
      `SELECT COUNT(*) AS n FROM reservations
       WHERE court_id = ? AND club_id = ? AND status = 'confirmed' AND reservation_date >= CURDATE()`,
      [id, clubId]
    );
    if (n > 0) {
      return res.status(409).json({
        ok: false,
        error: `No se puede eliminar: la pista tiene ${n} reserva(s) futura(s) activa(s)`,
      });
    }

    const [result] = await pool.query("DELETE FROM courts WHERE id = ? AND club_id = ?", [id, clubId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: "Pista no encontrada" });
    }

    await pool.query(
      "UPDATE clubs SET court_count = (SELECT COUNT(*) FROM courts WHERE club_id = ?) WHERE id = ?",
      [clubId, clubId]
    );

    return res.json({ ok: true, message: "Pista eliminada" });
  } catch (e) {
    console.error("ADMIN DELETE COURT ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error eliminando pista" });
  }
});

module.exports = router;
