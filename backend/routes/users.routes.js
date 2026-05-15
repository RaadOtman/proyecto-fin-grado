const express = require("express");
const jwt     = require("jsonwebtoken");
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

    if (req.user.role !== "user") {
      return res.status(403).json({ ok: false, error: "Solo los jugadores pueden seleccionar club desde esta ruta" });
    }

    // Si envían un clubId, comprobamos que ese club exista en la base de datos
    if (clubId !== null) {
      const [clubs] = await pool.query(
        "SELECT id, name FROM clubs WHERE id = ? AND name != 'PADEX Club' LIMIT 1",
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
      `SELECT u.id, u.name, u.email, u.role, u.club_id, c.name AS club_name
       FROM users u
       LEFT JOIN clubs c ON c.id = u.club_id
       WHERE u.id = ?
       LIMIT 1`,
      [id]
    );

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, club_id: user.club_id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("padel_token", token, {
      httpOnly: true,
      secure:   isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ ok: true, user });
  } catch (e) {
    console.error("PATCH /users/:id/club ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error actualizando club" });
  }
});

module.exports = router;
