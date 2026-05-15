// app.js - Configuración de Express sin el arranque del servidor
// Lo separamos así para poder importarlo en los tests sin abrir el puerto

const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit    = require("express-rate-limit");

const pool = require("./db");

const authRoutes         = require("./routes/auth.routes");
const reservationsRoutes = require("./routes/reservations.routes");
const adminRoutes        = require("./routes/admin.routes");
const clubsRoutes        = require("./routes/clubs.routes");
const usersRoutes        = require("./routes/users.routes");

const app = express();

// ── CORS ──────────────────────────────────────────────────────
// Solo dejamos pasar peticiones desde el frontend (local o en producción)

const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...envOrigins,
];

app.use(
  cors({
    origin(origin, callback) {
      // Si no hay origin (Postman, tests, etc.) dejamos pasar
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  })
);

// Middleware para leer cookies y JSON del body
app.use(cookieParser());
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────
// Limitamos intentos de login y registro para evitar fuerza bruta

app.use(
  "/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiados intentos. Espera 15 minutos." },
  })
);

app.use(
  "/auth/register",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiados registros desde esta IP. Espera 1 hora." },
  })
);

// ── Logger ────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

// ── Helpers ───────────────────────────────────────────────────

function toHHMM(t) {
  return String(t || "").slice(0, 5);
}

async function getDefaultClubId() {
  const [rows] = await pool.query(
    "SELECT id FROM clubs WHERE name = 'PADEX Club' ORDER BY id ASC LIMIT 1"
  );
  if (rows.length > 0) return rows[0].id;

  const [result] = await pool.query(
    `INSERT INTO clubs (name, city, address, description, image_url, maps_url, court_count)
     VALUES ('PADEX Club', 'Sin ciudad', NULL, 'Club por defecto migrado para compatibilidad multi-club.', NULL, NULL, 0)`
  );
  return result.insertId;
}

async function resolvePublicClubId(req) {
  const requestedClubId = Number(req.query.club_id || req.query.clubId);
  if (requestedClubId) {
    const [rows] = await pool.query(
      "SELECT id FROM clubs WHERE id = ? LIMIT 1",
      [requestedClubId]
    );
    if (rows.length > 0) return requestedClubId;
  }
  return getDefaultClubId();
}

async function getTimeSlots(clubId) {
  const [[cfg]] = await pool.query(
    "SELECT opening_time, closing_time, slot_minutes FROM club_settings WHERE club_id = ? LIMIT 1",
    [clubId]
  );
  if (!cfg) return [];
  const slots = [];
  let [h, m] = cfg.opening_time.split(":").map(Number);
  const [closeH, closeM] = cfg.closing_time.split(":").map(Number);
  const closeTotal = closeH * 60 + closeM;

  while (true) {
    const total = h * 60 + m;
    if (total + cfg.slot_minutes > closeTotal) break;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += cfg.slot_minutes;
    h += Math.floor(m / 60);
    m %= 60;
  }
  return slots;
}

// ── Rutas base ────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ message: "API Padex funcionando" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Padel API funcionando" });
});

// Solo en desarrollo: comprueba si la base de datos responde
if (process.env.NODE_ENV !== "production") {
  app.get("/test-db", async (_req, res) => {
    try {
      const [rows] = await pool.query("SELECT 1 AS ok");
      res.json({ ok: true, message: "Conexión con MySQL correcta", result: rows });
    } catch (error) {
      res.status(500).json({ ok: false, error: "Error de conexión con MySQL" });
    }
  });
}

// ── GET /courts ───────────────────────────────────────────────
app.get("/courts", async (req, res) => {
  try {
    const clubId = await resolvePublicClubId(req);
    const [courts] = await pool.query(
      "SELECT id, name, type FROM courts WHERE club_id = ? AND status = 'active' ORDER BY id",
      [clubId]
    );
    res.json({ courts });
  } catch (error) {
    console.error("Error en /courts:", error);
    res.status(500).json({ error: "Error cargando pistas" });
  }
});

// ── GET /availability?date=YYYY-MM-DD ─────────────────────────
app.get("/availability", async (req, res) => {
  try {
    const date = req.query.date;
    const clubId = await resolvePublicClubId(req);

    if (!date) {
      return res.status(400).json({ error: 'Falta el parámetro "date" (YYYY-MM-DD)' });
    }

    const [activeCourts] = await pool.query(
      "SELECT id, name, type FROM courts WHERE club_id = ? AND status = 'active' ORDER BY id",
      [clubId]
    );

    const timeSlots = await getTimeSlots(clubId);

    const [rows] = await pool.query(
      `SELECT court_id, start_time
       FROM   reservations
       WHERE  club_id = ?
         AND  reservation_date = ?
         AND  status = 'confirmed'`,
      [clubId, date]
    );

    const occupied = new Map();
    rows.forEach((r) => {
      const key = r.court_id;
      if (!occupied.has(key)) occupied.set(key, new Set());
      occupied.get(key).add(toHHMM(r.start_time));
    });

    const courts = activeCourts.map((court) => {
      const taken = occupied.get(court.id) || new Set();
      const slots = timeSlots.map((time) => ({
        time,
        status: taken.has(time) ? "OCCUPIED" : "FREE",
      }));
      return { ...court, slots };
    });

    res.json({ date, timeSlots, courts });
  } catch (error) {
    console.error("Error en availability:", error);
    res.status(500).json({ error: "Error en availability" });
  }
});

// ── Rutas de la aplicación ────────────────────────────────────
app.use("/auth",         authRoutes);
app.use("/reservations", reservationsRoutes);
app.use("/admin",        adminRoutes);
app.use("/clubs",        clubsRoutes);
app.use("/users",        usersRoutes);

// ── 404 ───────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

module.exports = app;
