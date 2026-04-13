const express = require("express");
const pool    = require("../db");
const auth    = require("../middleware/auth");

const router = express.Router();

// ── PATCH /users/:id/club ─────────────────────────────────────
// Actualiza el club al que pertenece el usuario
// body: { clubId }  — enviar null para desasociar el club
// Solo el propio usuario puede cambiar su club
router.patch("/:id/club", auth, async (req, res) => {
  try {
    const id     = Number(req.params.id);
    const clubId = req.body?.clubId != null ? Number(req.body.clubId) : null;

    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    // Un usuario no puede modificar el club de otra persona
    if (id !== req.user.id) {
      return res.status(403).json({ ok: false, error: "No autorizado" });
    }

    // Si envían un clubId, comprobamos que ese club exista en la base de datos
    if (clubId !== null) {
      const [clubs] = await pool.query(
        "SELECT id FROM clubs WHERE id = ? LIMIT 1",
        [clubId]
      );
      if (clubs.length === 0) {
        return res.status(404).json({ ok: false, error: "Club no encontrado" });
      }
    }

    // Actualizamos el club del usuario
    await pool.query("UPDATE users SET club_id = ? WHERE id = ?", [clubId, id]);

    // Devolvemos los datos actualizados del usuario
    const [rows] = await pool.query(
      "SELECT id, name, email, role, club_id FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    return res.json({ ok: true, user: rows[0] });
  } catch (e) {
    console.error("PATCH /users/:id/club ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error actualizando club" });
  }
});

module.exports = router;
