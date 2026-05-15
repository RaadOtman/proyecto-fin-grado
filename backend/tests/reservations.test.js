// Tests simples para las reservas
// Ejecutar con: npm test (desde la carpeta backend)

// Ponemos un secreto de prueba antes de cargar la app
process.env.JWT_SECRET = "test_secret_padex";
process.env.NODE_ENV   = "test";

// Mockeamos la base de datos para no necesitar MySQL en los tests
jest.mock("../db", () => ({ query: jest.fn() }));

const request = require("supertest");
const jwt     = require("jsonwebtoken");
const app     = require("../app");
const pool    = require("../db");

// Limpiamos los mocks antes de cada test para que no se mezclen
beforeEach(() => {
  jest.clearAllMocks();
});

// ── Test 1 ────────────────────────────────────────────────────
// Comprobamos que una ruta protegida devuelve 401 si no hay sesión iniciada
test("GET /reservations/my sin autenticación devuelve 401", async () => {
  const res = await request(app).get("/reservations/my");

  expect(res.status).toBe(401);
  // El backend debe devolver un mensaje de error
  expect(res.body.error).toBeTruthy();
});

// ── Test 2 ────────────────────────────────────────────────────
// Comprobamos que no se puede reservar una franja que ya está ocupada
test("POST /reservations con franja ya ocupada devuelve 409", async () => {
  // Creamos un token de prueba para pasar el middleware de autenticación
  const token = jwt.sign(
    { id: 1, email: "test@padex.com", role: "user", club_id: 1 },
    process.env.JWT_SECRET
  );

  // Usamos la fecha de mañana para que no falle la validación de fecha pasada
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaISO = manana.toISOString().split("T")[0];

  // Simulamos las respuestas de la base de datos en el orden en que se hacen
  pool.query
    .mockResolvedValueOnce([[{ slot_minutes: 90, max_days_ahead: 30 }]])  // config del club (límite de días)
    .mockResolvedValueOnce([[{ id: 1 }]])                                   // la pista existe y está activa
    .mockResolvedValueOnce([[{ opening_time: "09:00", closing_time: "21:00", slot_minutes: 90 }]]) // horarios del club
    .mockResolvedValueOnce([[{ id: 99 }]]);                                 // ya existe reserva en esa franja

  const res = await request(app)
    .post("/reservations")
    .set("Cookie", [`padel_token=${token}`])
    .send({
      court_id:         1,
      reservation_date: mananaISO,
      start_time:       "09:00",
    });

  // Si la franja está ocupada el backend debe devolver 409 Conflict
  expect(res.status).toBe(409);
  expect(res.body.error).toBe("Esta franja ya está ocupada");
});
