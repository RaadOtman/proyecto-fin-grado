const jwt = require("jsonwebtoken");

// Middleware de autenticación para rutas exclusivas del administrador
// Hace lo mismo que auth.js pero además comprueba que el usuario tenga rol 'admin'
function adminAuth(req, res, next) {
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

    req.user = payload; // { id, email, role }
    return next();
  } catch {
    return res.status(401).json({ ok: false, error: "Sesión expirada" });
  }
}

module.exports = adminAuth;
