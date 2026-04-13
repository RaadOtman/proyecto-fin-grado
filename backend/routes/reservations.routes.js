const express = require("express");
const pool    = require("../db");
const auth    = require("../middleware/auth");

const router = express.Router();

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Recorta "HH:MM:SS" a "HH:MM" para que los horarios sean consistentes
function toHHMM(timeStr) {
  return String(timeStr || "").slice(0, 5);
}

// Lee los ajustes del club y genera la lista de slots horarios disponibles
async function getTimeSlots() {
  const [[cfg]] = await pool.query(
    "SELECT opening_time, closing_time, slot_minutes FROM club_settings LIMIT 1"
  );
  const slots = [];
  let [h, m] = cfg.opening_time.split(":").map(Number);
  const [closeH, closeM] = cfg.closing_time.split(":").map(Number);
  const closeTotal = closeH * 60 + closeM;

  while (true) {
    const total = h * 60 + m;
    if (total + cfg.slot_minutes > closeTotal) break;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += cfg.slot_minutes;
    h += Math.floor(m / 60);
    m %= 60;
  }
  return { slots, slotMinutes: cfg.slot_minutes };
}

// Suma minutos a una hora "HH:MM" y devuelve el resultado en el mismo formato
function addMinutes(timeHHMM, minutes) {
  const [h, m] = timeHHMM.split(":").map(Number);
  const total  = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ── POST /reservations ────────────────────────────────────────
// Crea una reserva nueva. Requiere sesión iniciada.
// body: { court_id, reservation_date, start_time }
router.post("/", auth, async (req, res) => {
  try {
    const court_id         = Number(req.body?.court_id);
    const reservation_date = String(req.body?.reservation_date || "").trim();
    const start_time       = String(req.body?.start_time       || "").trim();

    if (!court_id || !reservation_date || !start_time) {
      return res.status(400).json({
        ok: false,
        error: "court_id, reservation_date y start_time son obligatorios",
      });
    }

    // Validamos que la fecha tenga el formato correcto
    if (!DATE_REGEX.test(reservation_date)) {
      return res.status(400).json({ ok: false, error: "Formato de fecha inválido (YYYY-MM-DD)" });
    }

    // No permitimos reservas en fechas pasadas
    const parsedDate = new Date(reservation_date + "T00:00:00");
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (parsedDate < todayStart) {
      return res.status(400).json({ ok: false, error: "No se puede reservar en el pasado" });
    }

    // Comprobamos que no se reserve con demasiada antelación según la config del club
    const [[cfg]] = await pool.query(
      "SELECT slot_minutes, max_days_ahead FROM club_settings LIMIT 1"
    );
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + cfg.max_days_ahead);
    maxDate.setHours(23, 59, 59, 999);
    if (parsedDate > maxDate) {
      return res.status(400).json({
        ok: false,
        error: `Solo puedes reservar con un máximo de ${cfg.max_days_ahead} días de antelación`,
      });
    }

    // Verificamos que la pista existe y está activa
    const [courtRows] = await pool.query(
      "SELECT id FROM courts WHERE id = ? AND status = 'active' LIMIT 1",
      [court_id]
    );
    if (courtRows.length === 0) {
      return res.status(400).json({ ok: false, error: "Pista inválida o no disponible" });
    }

    // Comprobamos que start_time coincide con un slot válido del club
    const { slots, slotMinutes } = await getTimeSlots();
    const normalizedStart = toHHMM(start_time);
    if (!slots.includes(normalizedStart)) {
      return res.status(400).json({ ok: false, error: "Hora de inicio inválida" });
    }

    // Calculamos la hora de fin sumando la duración del slot
    const end_time = addMinutes(normalizedStart, slotMinutes);

    // Insertamos la reserva — la constraint UNIQUE de la tabla evita dobles reservas
    const [result] = await pool.query(
      `INSERT INTO reservations
         (court_id, reservation_date, start_time, end_time, user_id, status, created_by)
       VALUES (?, ?, ?, ?, ?, 'confirmed', 'user')`,
      [court_id, reservation_date, normalizedStart, end_time, req.user.id]
    );

    return res.json({
      ok: true,
      message: "Reserva creada",
      reservationId: result.insertId,
    });
  } catch (e) {
    // Si hay duplicado la base de datos lanza ER_DUP_ENTRY
    if (e.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ ok: false, error: "Ese tramo ya está ocupado" });
    }
    console.error("CREATE RESERVATION ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error creando reserva" });
  }
});

// ── GET /reservations/my ──────────────────────────────────────
// Devuelve las reservas del usuario autenticado (sin las canceladas)
router.get("/my", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id,
              r.court_id,
              c.name  AS court_name,
              r.reservation_date,
              r.start_time,
              r.end_time,
              r.status,
              r.players_count,
              r.notes
       FROM   reservations r
       JOIN   courts c ON c.id = r.court_id
       WHERE  r.user_id = ?
         AND  r.status != 'cancelled'
       ORDER  BY r.reservation_date DESC, r.start_time DESC`,
      [req.user.id]
    );

    // Normalizamos los horarios a HH:MM y las fechas a string YYYY-MM-DD
    const reservations = rows.map((r) => ({
      ...r,
      reservation_date: r.reservation_date instanceof Date
        ? r.reservation_date.toISOString().split("T")[0]
        : String(r.reservation_date),
      start_time: toHHMM(r.start_time),
      end_time:   toHHMM(r.end_time),
    }));

    return res.json({ ok: true, count: reservations.length, reservations });
  } catch (e) {
    console.error("MY RESERVATIONS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error listando reservas" });
  }
});

// ── DELETE /reservations/:id ──────────────────────────────────
// Cancela una reserva propia (no la borra, solo cambia el estado a 'cancelled')
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    // Buscamos la reserva y comprobamos que pertenece al usuario autenticado
    const [rows] = await pool.query(
      `SELECT id, reservation_date, start_time, status
       FROM   reservations
       WHERE  id = ? AND user_id = ?
       LIMIT  1`,
      [id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Reserva no encontrada o no es tuya" });
    }

    const reservation = rows[0];

    if (reservation.status === "cancelled") {
      return res.status(400).json({ ok: false, error: "La reserva ya está cancelada" });
    }

    // El club puede configurar con cuántas horas de antelación mínima se puede cancelar
    const [[cfg]] = await pool.query(
      "SELECT cancel_hours_limit FROM club_settings LIMIT 1"
    );

    const dateStr = reservation.reservation_date instanceof Date
      ? reservation.reservation_date.toISOString().split("T")[0]
      : String(reservation.reservation_date);

    const reservationDateTime    = new Date(`${dateStr}T${toHHMM(reservation.start_time)}:00`);
    const hoursUntilReservation  = (reservationDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

    if (hoursUntilReservation < cfg.cancel_hours_limit) {
      return res.status(400).json({
        ok: false,
        error: `No se puede cancelar con menos de ${cfg.cancel_hours_limit} horas de antelación`,
      });
    }

    // Marcamos la reserva como cancelada (soft delete)
    await pool.query(
      "UPDATE reservations SET status = 'cancelled' WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );

    return res.json({ ok: true, message: "Reserva cancelada" });
  } catch (e) {
    console.error("DELETE RESERVATION ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error cancelando reserva" });
  }
});

module.exports = router;
