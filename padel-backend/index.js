const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

const authRoutes = require("./routes/auth.routes");
const reservationsRoutes = require("./routes/reservations.routes");

const app = express();
const PORT = process.env.PORT || 4000;

const TIME_SLOTS = ["09:00","10:30","12:00","13:30","15:00","16:30","18:00","19:30","21:00"];

const COURTS = [
  { id: 1, name: "Pista 1", type: "Exterior" },
  { id: 2, name: "Pista 2", type: "Exterior" },
  { id: 3, name: "Pista 3", type: "Interior" },
  { id: 4, name: "Pista 4", type: "Interior" },
];

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

// Health
app.get("/health", (_req, res) => {
  res.json({ status: "OK", message: "Padel API funcionando" });
});

// Courts
app.get("/courts", (_req, res) => {
  res.json({ courts: COURTS });
});

// Availability (ocupado si existe en reservations)
app.get("/availability", async (req, res) => {
  try {
    const date = req.query.date;
    if (!date) {
      return res.status(400).json({ error: 'Falta el parámetro "date" (YYYY-MM-DD)' });
    }

    const [rows] = await pool.query(
      "SELECT courtId, time FROM reservations WHERE date=?",
      [date]
    );

    const occupied = new Map();
    rows.forEach((r) => {
      if (!occupied.has(r.courtId)) occupied.set(r.courtId, new Set());
      occupied.get(r.courtId).add(r.time);
    });

    const courts = COURTS.map((court) => {
      const set = occupied.get(court.id) || new Set();
      const slots = TIME_SLOTS.map((time) => ({
        time,
        status: set.has(time) ? "OCCUPIED" : "FREE",
      }));
      return { ...court, slots };
    });

    res.json({ date, timeSlots: TIME_SLOTS, courts });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error en availability" });
  }
});

// Rutas reales
app.use("/auth", authRoutes);
app.use("/reservations", reservationsRoutes);

app.use((_req, res) => {
  res.status(404).send("Ruta no encontrada");
});

app.listen(PORT, () => {
  console.log(`🚀 Backend escuchando en http://localhost:${PORT}`);
});