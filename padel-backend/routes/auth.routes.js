const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// POST /auth/register
// body: { email, password }
router.post("/register", async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    const passRaw = req.body?.password;

    const email = String(emailRaw || "").trim().toLowerCase();
    const password = String(passRaw || "");

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "Email y password obligatorios" });
    }

    if (password.length < 4) {
      return res
        .status(400)
        .json({ ok: false, error: "Password mínimo 4 caracteres" });
    }

    const [exists] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (exists.length > 0) {
      return res.status(409).json({ ok: false, error: "Email ya registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES (?, ?)",
      [email, password_hash]
    );

    return res.json({ ok: true, userId: result.insertId, email });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error en register" });
  }
});

// POST /auth/login
// body: { email, password }
router.post("/login", async (req, res) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res
        .status(500)
        .json({ ok: false, error: "Falta JWT_SECRET en .env" });
    }

    const emailRaw = req.body?.email;
    const passRaw = req.body?.password;

    const email = String(emailRaw || "").trim().toLowerCase();
    const password = String(passRaw || "");

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "Email y password obligatorios" });
    }

    const [rows] = await pool.query(
      "SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ ok: true, token, user: { id: user.id, email: user.email } });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error en login" });
  }
});

module.exports = router;