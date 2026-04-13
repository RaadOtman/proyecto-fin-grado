const express = require("express");
const pool    = require("../db");

const router = express.Router();

// ── GET /clubs ────────────────────────────────────────────────
// Devuelve todos los clubs disponibles ordenados por nombre
// Esta ruta es pública, no requiere iniciar sesión
router.get("/", async (_req, res) => {
  try {
    const [clubs] = await pool.query(
      `SELECT id, name, city, description, image_url, maps_url, court_count
       FROM   clubs
       ORDER  BY name ASC`
    );
    return res.json({ ok: true, clubs });
  } catch (e) {
    console.error("GET /clubs ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo clubes" });
  }
});

// ── GET /clubs/:id ────────────────────────────────────────────
// Devuelve los datos de un club concreto por su ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, error: "ID inválido" });
    }

    const [rows] = await pool.query(
      `SELECT id, name, city, description, image_url, maps_url, court_count
       FROM   clubs
       WHERE  id = ?
       LIMIT  1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Club no encontrado" });
    }

    return res.json({ ok: true, club: rows[0] });
  } catch (e) {
    console.error("GET /clubs/:id ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error obteniendo el club" });
  }
});

module.exports = router;
