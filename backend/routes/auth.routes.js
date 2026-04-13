const express = require("express");
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const pool    = require("../db");

const router = express.Router();

// ── POST /auth/register ───────────────────────────────────────
// Registra un usuario nuevo con email, contraseña y nombre opcional
router.post("/register", async (req, res) => {
  try {
    const emailRaw = req.body?.email;
    const passRaw  = req.body?.password;
    const nameRaw  = req.body?.name;

    const email    = String(emailRaw || "").trim().toLowerCase();
    const password = String(passRaw  || "");
    // Si no llega name, usamos la parte del email antes del @ como nombre por defecto
    const name     = String(nameRaw || "").trim() || email.split("@")[0];

    // Validaciones básicas antes de tocar la base de datos
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email y contraseña obligatorios" });
    }
    if (password.length < 4) {
      return res.status(400).json({ ok: false, error: "La contraseña debe tener mínimo 4 caracteres" });
    }

    // Comprobamos si el email ya está registrado
    const [exists] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    if (exists.length > 0) {
      return res.status(409).json({ ok: false, error: "Email ya registrado" });
    }

    // Ciframos la contraseña antes de guardarla (nunca se guarda en texto plano)
    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, password_hash]
    );

    return res.json({ ok: true, email });
  } catch (e) {
    console.error("REGISTER ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error al registrar usuario" });
  }
});

// ── POST /auth/login ──────────────────────────────────────────
// Inicia sesión y devuelve un token en una cookie HTTP-only
router.post("/login", async (req, res) => {
  try {
    // Si falta el secreto en el .env, avisamos en vez de fallar en silencio
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ ok: false, error: "Falta JWT_SECRET en .env" });
    }

    const emailRaw = req.body?.email;
    const passRaw  = req.body?.password;

    const email    = String(emailRaw || "").trim().toLowerCase();
    const password = String(passRaw  || "");

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email y contraseña obligatorios" });
    }

    // Buscamos el usuario por email
    const [rows] = await pool.query(
      "SELECT id, name, email, password_hash, role, is_active, club_id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    // Si no existe el usuario devolvemos el mismo error que si la contraseña es incorrecta
    // (así no damos pistas sobre qué emails están registrados)
    if (rows.length === 0) {
      return res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    }

    const user = rows[0];

    // El admin puede desactivar cuentas desde el panel
    if (!user.is_active) {
      return res.status(403).json({ ok: false, error: "Cuenta desactivada. Contacta con el club." });
    }

    // Comparamos la contraseña con el hash guardado en la base de datos
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ ok: false, error: "Credenciales incorrectas" });
    }

    // Creamos el token JWT con los datos básicos del usuario
    // Expira en 7 días
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Guardamos el token en una cookie HTTP-only para que el frontend no pueda leerlo con JS
    // En producción usamos secure y sameSite none (necesario para Vercel + Render)
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("padel_token", token, {
      httpOnly: true,
      secure:   isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      ok: true,
      id:      user.id,
      name:    user.name,
      email:   user.email,
      role:    user.role,
      club_id: user.club_id ?? null,
    });
  } catch (e) {
    console.error("LOGIN ERROR:", e);
    return res.status(500).json({ ok: false, error: "Error al iniciar sesión" });
  }
});

// ── POST /auth/logout ─────────────────────────────────────────
// Elimina la cookie del navegador para cerrar la sesión
router.post("/logout", (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("padel_token", {
    httpOnly: true,
    secure:   isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
  return res.json({ ok: true });
});

module.exports = router;
