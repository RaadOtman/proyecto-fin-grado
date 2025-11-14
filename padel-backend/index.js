// index.js - Backend Padel Booking (REAL)
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 4000;

// Bloques de 1h 30min (partidos estándar)
const TIME_SLOTS = [
  '09:00',
  '10:30',
  '12:00',
  '13:30',
  '15:00',
  '16:30',
  '18:00',
  '19:30',
  '21:00',
];

// Pistas del club (de momento en memoria)
const COURTS = [
  { id: 1, name: 'Pista 1', type: 'Exterior' },
  { id: 2, name: 'Pista 2', type: 'Exterior' },
  { id: 3, name: 'Pista 3', type: 'Interior' },
  { id: 4, name: 'Pista 4', type: 'Interior' },
];

// Reservas guardadas en memoria (hasta usar MySQL)
let fakeReservations = [];
let nextReservationId = 1;

// Middlewares
app.use(cors());
app.use(express.json());

// Log básico de cada petición
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.url}`);
  next();
});

// ========= ENDPOINTS ========= //

// Health check
app.get('/health', (req, res) => {
  console.log('✅ /health');
  res.json({ status: 'OK', message: 'Padel API funcionando (real)' });
});

// Pistas
app.get('/courts', (req, res) => {
  console.log('🎾 /courts');
  res.json({ courts: COURTS });
});

// Disponibilidad por fecha (tiene en cuenta reservas reales)
// GET /availability?date=YYYY-MM-DD
app.get('/availability', (req, res) => {
  const date = req.query.date; // ejemplo: 2025-11-20
  console.log('📅 /availability para fecha:', date);

  if (!date) {
    return res
      .status(400)
      .json({ error: 'Falta el parámetro "date" en formato YYYY-MM-DD' });
  }

  // Mapa base de ocupación (hardcoded de ejemplo)
  const baseOccupiedMap = {
    // pistaId: [horas ocupadas]
    1: ['18:00', '19:30'],
    2: ['18:00'],
    3: ['19:30'],
    4: [],
  };

  // Añadimos las reservas que se han ido creando en memoria para esa fecha
  const dynamicOccupiedMap = {};

  fakeReservations
    .filter((r) => r.date === date)
    .forEach((r) => {
      if (!dynamicOccupiedMap[r.courtId]) {
        dynamicOccupiedMap[r.courtId] = new Set();
      }
      dynamicOccupiedMap[r.courtId].add(r.time);
    });

  const availability = COURTS.map((court) => {
    const baseTimes = baseOccupiedMap[court.id] || [];
    const dynamicTimesSet = dynamicOccupiedMap[court.id] || new Set();

    const occupiedSet = new Set([
      ...baseTimes,
      ...Array.from(dynamicTimesSet),
    ]);

    const slots = TIME_SLOTS.map((time) => ({
      time,
      status: occupiedSet.has(time) ? 'OCCUPIED' : 'FREE',
    }));

    return {
      id: court.id,
      name: court.name,
      type: court.type,
      slots,
    };
  });

  res.json({
    date,
    timeSlots: TIME_SLOTS,
    courts: availability,
  });
});

// DEBUG sencillo GET /reserve-test (para ver si la ruta existe)
app.get('/reserve-test', (req, res) => {
  console.log('🔍 GET /reserve-test');
  res.json({ ok: true, message: 'Ruta /reserve está disponible (GET test)' });
});

// Crear reserva (simulada en memoria)
// POST /reserve
// body: { courtId: number, date: string, time: string }
app.post('/reserve', (req, res) => {
  console.log('📝 POST /reserve – body recibido:', req.body);

  const { courtId, date, time } = req.body;

  // Validación básica
  if (!courtId || !date || !time) {
    return res.status(400).json({
      ok: false,
      error: 'Faltan datos: courtId, date y time son obligatorios',
    });
  }

  const reservation = {
    id: nextReservationId++,
    courtId,
    date,
    time,
  };

  fakeReservations.push(reservation);

  res.json({
    ok: true,
    message: 'Reserva creada correctamente',
    reservationId: reservation.id,
    reservation,
  });
});

// Listar reservas (de momento todas, sin usuario)
// GET /reservations
// Opcionalmente: ?date=YYYY-MM-DD&courtId=1
app.get('/reservations', (req, res) => {
  const { date, courtId } = req.query;
  console.log('📋 GET /reservations', 'date=', date, 'courtId=', courtId);

  let results = fakeReservations;

  if (date) {
    results = results.filter((r) => r.date === date);
  }

  if (courtId) {
    const cid = parseInt(courtId, 10);
    if (!isNaN(cid)) {
      results = results.filter((r) => r.courtId === cid);
    }
  }

  res.json({
    count: results.length,
    reservations: results,
  });
});

// Cancelar reserva por id
// DELETE /reservations/:id
app.delete('/reservations/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  console.log('🗑️  DELETE /reservations/', id);

  if (isNaN(id)) {
    return res.status(400).json({ ok: false, error: 'ID de reserva no válido' });
  }

  const beforeCount = fakeReservations.length;
  fakeReservations = fakeReservations.filter((r) => r.id !== id);
  const afterCount = fakeReservations.length;

  if (afterCount === beforeCount) {
    return res.status(404).json({ ok: false, error: 'Reserva no encontrada' });
  }

  res.json({ ok: true, message: `Reserva ${id} cancelada correctamente` });
});

// ========= 404 ========= //

app.use((req, res) => {
  console.log('⛔ Ruta no encontrada:', req.method, req.url);
  res.status(404).send('Ruta no encontrada en Padel API REAL');
});

// ========= ARRANCAR SERVIDOR ========= //

app.listen(PORT, () => {
  console.log(`🚀 Padel API REAL escuchando en http://localhost:${PORT}`);
});