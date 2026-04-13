const jwt = require("jsonwebtoken");

// Middleware de autenticación para rutas protegidas
// Lo usamos en cualquier ruta que requiera que el usuario haya iniciado sesión
function auth(req, res, next) {
  // El token se guarda en una cookie HTTP-only llamada "padel_token"
  const token = req.cookies?.padel_token;

  if (!token) {
    return res.status(401).json({ ok: false, error: "No autenticado" });
  }

  try {
    // Verificamos el token con el secreto del .env
    // Si es válido, sacamos los datos del usuario (id, email) y los guardamos en req.user
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email }
    return next();
  } catch {
    // Si el token ha expirado o no es válido, devolvemos error
    return res.status(401).json({ ok: false, error: "Sesión expirada" });
  }
}

module.exports = auth;
