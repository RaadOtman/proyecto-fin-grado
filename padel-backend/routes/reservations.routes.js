const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// Crear reserva (protegido)
// POST /reservations
// body: { courtId, date, time }
router.post("/", auth, async (req, res) => {
  try {
    const courtId = Number(req.body?.courtId);
    const date = String(req.body?.date || "").trim();
    const time = String(req.body?.time || "").trim();

    if (!courtId || !date || !time) {
      return res
        .status(400)
        .json({ ok: false, error: "courtId, date y time obligatorios" });
    }

    // Comprobar si ya existe reserva para esa pista/fecha/hora
    const [exists] = await pool.query(
      "SELECT id FROM reservations WHERE courtId=? AND date=? AND time=? LIMIT 1",
      [courtId, date, time]
    );

    if (exists.length > 0) {
      return res.status(409).json({ ok: false, error: "Ese tramo ya está ocupado" });
    }

    const [result] = await pool.query(
      "INSERT INTO reservations (courtId, date, time, user_id) VALUES (?,?,?,?)",
      [courtId, date, time, req.user.id]
    );

    return res.json({
      ok: true,
      message: "Reserva creada",
      reservationId: result.insertId,
    });
  } catch (e) {
    console.error("CREATE RESERVATION ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error creando reserva" });
  }
});

// Mis reservas (protegido)
// GET /reservations/my
router.get("/my", auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, courtId, date, time FROM reservations WHERE user_id=? ORDER BY date DESC, time DESC",
      [req.user.id]
    );

    return res.json({ ok: true, count: rows.length, reservations: rows });
  } catch (e) {
    console.error("MY RESERVATIONS ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error listando reservas" });
  }
});

// Cancelar una reserva propia (protegido)
// DELETE /reservations/:id
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    const [result] = await pool.query(
      "DELETE FROM reservations WHERE id=? AND user_id=?",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ ok: false, error: "Reserva no encontrada o no es tuya" });
    }

    return res.json({ ok: true, message: "Reserva cancelada" });
  } catch (e) {
    console.error("DELETE RESERVATION ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error cancelando reserva" });
  }
});

module.exports = router;