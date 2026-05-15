const jwt = require("jsonwebtoken");
const pool = require("../db");

// Middleware de autenticación para rutas exclusivas del administrador
// Hace lo mismo que auth.js pero además comprueba que el usuario tenga rol 'admin'
async function adminAuth(req, res, next) {
  const token = req.cookies?.padel_token;

  if (!token) {
    return res.status(401).json({ ok: false, error: "No autenticado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Si el usuario no es admin, bloqueamos el acceso aunque tenga sesión
    if (payload.role !== "admin") {
      return res.status(403).json({ ok: false, error: "Acceso denegado: se requiere rol admin" });
    }

    if (!payload.club_id && payload.id) {
      const [rows] = await pool.query(
        "SELECT club_id FROM users WHERE id = ? LIMIT 1",
        [payload.id]
      );
      payload.club_id = rows[0]?.club_id ?? null;
    }

    req.user = payload; // { id, email, role, club_id }
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Sesión expirada" });
  }
}

module.exports = adminAuth;
