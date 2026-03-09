const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization || "";

  // Formato esperado: "Bearer <token>"
  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Falta token (Bearer)" });
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({ ok: false, error: "Token vacío" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, email }
    return next();
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Token inválido o caducado" });
  }
}

module.exports = auth;