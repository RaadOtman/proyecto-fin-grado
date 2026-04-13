// Importamos los módulos principales
const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit    = require("express-rate-limit");

// Cargamos las variables del archivo .env (contraseñas, puerto, etc.)
require("dotenv").config();

// Conexión a la base de datos (pool de MySQL)
const pool = require("./db");

// Importamos las rutas de cada sección de la API
const authRoutes         = require("./routes/auth.routes");
const reservationsRoutes = require("./routes/reservations.routes");
const adminRoutes        = require("./routes/admin.routes");
const clubsRoutes        = require("./routes/clubs.routes");
const usersRoutes        = require("./routes/users.routes");

const app  = express();
const PORT = process.env.PORT || 4000;

// ── CORS ──────────────────────────────────────────────────────
// Solo dejamos pasar peticiones desde el frontend (local o en producción)

const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Orígenes permitidos: los de local más los del .env
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  ...envOrigins,
];

app.use(
  cors({
    origin(origin, callback) {
      // Si no hay origin (petición directa o Postman) dejamos pasar
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("⛔ Origen bloqueado por CORS:", origin);
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true, // necesario para que funcionen las cookies
  })
);

// Middleware para leer cookies y JSON del body
app.use(cookieParser());
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────
// Limitamos cuántas veces se puede intentar hacer login o registro
// para evitar ataques de fuerza bruta

app.use(
  "/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000, // ventana de 15 minutos
    max: 10,                   // máximo 10 intentos por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiados intentos. Espera 15 minutos." },
  })
);

app.use(
  "/auth/register",
  rateLimit({
    windowMs: 60 * 60 * 1000, // ventana de 1 hora
    max: 5,                    // máximo 5 registros por IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: "Demasiados registros desde esta IP. Espera 1 hora." },
  })
);

// ── Logger ────────────────────────────────────────────────────
// Muestra en consola cada petición que llega al servidor
app.use((req, _res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

// ── Helpers ───────────────────────────────────────────────────

// Recorta "09:00:00" a "09:00" para que los horarios sean consistentes
function toHHMM(t) {
  return String(t || "").slice(0, 5);
}

// Lee los ajustes del club (horario, duración de slots) y genera la lista de horarios disponibles
async function getTimeSlots() {
  const [[cfg]] = await pool.query(
    "SELECT opening_time, closing_time, slot_minutes FROM club_settings LIMIT 1"
  );
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

// Ruta de prueba para saber si la API está encendida
app.get("/", (_req, res) => {
  res.json({ message: "API Padex funcionando" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Padel API funcionando", allowedOrigins });
});

// Ruta solo para desarrollo: comprueba si la base de datos responde bien
if (process.env.NODE_ENV !== "production") {
  app.get("/test-db", async (_req, res) => {
    try {
      const [rows] = await pool.query("SELECT 1 AS ok");
      res.json({ ok: true, message: "Conexión con MySQL correcta", result: rows });
    } catch (error) {
      console.error("Error al conectar con MySQL:", error);
      res.status(500).json({ ok: false, error: "Error de conexión con MySQL", detalle: error.message });
    }
  });
}

// ── GET /courts ───────────────────────────────────────────────
// Devuelve las pistas activas para el selector del frontend

app.get("/courts", async (_req, res) => {
  try {
    const [courts] = await pool.query(
      "SELECT id, name, type FROM courts WHERE status = 'active' ORDER BY id"
    );
    res.json({ courts });
  } catch (error) {
    console.error("Error en /courts:", error);
    res.status(500).json({ error: "Error cargando pistas" });
  }
});

// ── GET /availability?date=YYYY-MM-DD ─────────────────────────
// Devuelve las pistas con sus slots y si están libres u ocupados para una fecha concreta

app.get("/availability", async (req, res) => {
  try {
    const date = req.query.date;

    if (!date) {
      return res.status(400).json({ error: 'Falta el parámetro "date" (YYYY-MM-DD)' });
    }

    // Sacamos las pistas activas
    const [activeCourts] = await pool.query(
      "SELECT id, name, type FROM courts WHERE status = 'active' ORDER BY id"
    );

    // Generamos los horarios disponibles según la configuración del club
    const timeSlots = await getTimeSlots();

    // Buscamos las reservas confirmadas del día para saber qué slots están ocupados
    const [rows] = await pool.query(
      `SELECT court_id, start_time
       FROM   reservations
       WHERE  reservation_date = ?
         AND  status = 'confirmed'`,
      [date]
    );

    // Creamos un mapa: id de pista → set de horarios ocupados
    const occupied = new Map();
    rows.forEach((r) => {
      const key = r.court_id;
      if (!occupied.has(key)) occupied.set(key, new Set());
      occupied.get(key).add(toHHMM(r.start_time));
    });

    // Construimos la respuesta con cada pista y sus slots marcados como FREE u OCCUPIED
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

// ── Rutas de aplicación ───────────────────────────────────────
// Cada grupo de rutas tiene su propio archivo en /routes

app.use("/auth",         authRoutes);
app.use("/reservations", reservationsRoutes);
app.use("/admin",        adminRoutes);
app.use("/clubs",        clubsRoutes);
app.use("/users",        usersRoutes);

// ── 404 ───────────────────────────────────────────────────────
// Si no existe la ruta, devolvemos un error claro
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ── Arranque del servidor ─────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en el puerto ${PORT}`);
  console.log("🌍 Orígenes permitidos por CORS:", allowedOrigins);
});
