import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLogIn,
  FiUser,
  FiArrowRight,
  FiSearch,
  FiZap,
  FiList,
  FiMapPin,
  FiGrid,
  FiActivity,
  FiRefreshCw,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { loginUser, getClub, getAvailability, getMyReservations } from "../lib/apiClient";

// Tipo de datos que devuelve el backend para un club
type ClubData = {
  id: number;
  name: string;
  city: string;
  description: string | null;
  image_url: string | null;
  maps_url: string | null;
  court_count: number | null;
};

type AvailabilityData = {
  date: string;
  timeSlots: string[];
  courts: {
    id: number;
    name: string;
    type: string;
    slots: { time: string; status: "FREE" | "OCCUPIED" }[];
  }[];
};

type ReservationItem = {
  id: number;
  court_name: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  status: string;
};

// Pasos del proceso de reserva, para la sección "Cómo funciona"
const STEPS = [
  {
    n: "01",
    title: "Elige la fecha",
    desc: "Selecciona el día que quieres jugar en el calendario.",
  },
  {
    n: "02",
    title: "Selecciona pista y hora",
    desc: "Ve los tramos libres de cada pista y reserva el que mejor te venga.",
  },
  {
    n: "03",
    title: "Confirmado",
    desc: "Tu reserva queda guardada al instante. Cancela cuando quieras.",
  },
];

// Tarjetas de funcionalidades que se muestran en la home
const FEATURES = [
  {
    icon: <FiSearch size={18} />,
    tag: "Disponibilidad",
    title: "Consulta en tiempo real",
    desc: "Revisa qué pistas están libres para cualquier fecha antes de reservar.",
  },
  {
    icon: <FiZap size={18} />,
    tag: "Rapidez",
    title: "Reserva en segundos",
    desc: "Sin formularios largos ni pasos innecesarios. Selecciona y confirma.",
  },
  {
    icon: <FiList size={18} />,
    tag: "Gestión",
    title: "Controla tus reservas",
    desc: "Consulta tus próximas reservas y cancela las que no necesites.",
  },
];

// Función reutilizable para la animación de entrada de las secciones
const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
});

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatShortDate(dateISO: string) {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
  });
}

function reservationTime(r: ReservationItem) {
  return new Date(`${r.reservation_date}T${r.start_time}:00`).getTime();
}

export default function Home() {
  const { isAuthenticated, userEmail, clubId, login } = useAuth();
  const navigate = useNavigate();

  // Estados del formulario de login rápido de la home
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  // Datos del club del usuario para mostrar el hero dinámico
  const [club, setClub] = useState<ClubData | null>(null);
  const [todayAvailability, setTodayAvailability] = useState<AvailabilityData | null>(null);
  const [myReservations, setMyReservations] = useState<ReservationItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Cuando cambia el club del usuario, lo cargamos desde el backend
  useEffect(() => {
    if (clubId) {
      getClub(clubId)
        .then((d) => setClub(d.club ?? null))
        .catch(() => setClub(null));
    } else {
      setClub(null);
    }
  }, [clubId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTodayAvailability(null);
      setMyReservations([]);
      return;
    }

    setDashboardLoading(true);
    Promise.allSettled([getAvailability(todayISO()), getMyReservations()])
      .then(([availabilityResult, reservationsResult]) => {
        if (availabilityResult.status === "fulfilled") {
          setTodayAvailability(availabilityResult.value);
        } else {
          setTodayAvailability(null);
        }

        if (reservationsResult.status === "fulfilled") {
          setMyReservations(reservationsResult.value.reservations || []);
        } else {
          setMyReservations([]);
        }
      })
      .finally(() => setDashboardLoading(false));
  }, [isAuthenticated]);

  // Maneja el login desde el formulario de acceso rápido de la home
  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(email.trim(), password);
      const emailFromApi  = res.email    ?? email.trim();
      const roleFromApi   = res.role     ?? "user";
      const idFromApi     = res.id       ?? null;
      const clubIdFromApi = res.club_id  ?? null;
      login(emailFromApi, roleFromApi, idFromApi, clubIdFromApi);
      setMsg("Sesión iniciada correctamente");
      // Si es admin va al dashboard, si no a la página de reservar
      setTimeout(() => navigate(roleFromApi === "admin" ? "/admin/dashboard" : "/reservar"), 500);
    } catch (err: any) {
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  const userName = userEmail?.split("@")[0] || "jugador";
  const activeReservations = myReservations
    .filter((r) => reservationTime(r) >= Date.now())
    .sort((a, b) => reservationTime(a) - reservationTime(b));
  const nextReservation = activeReservations[0] || null;
  const availableCourts = todayAvailability?.courts.filter((court) =>
    court.slots.some((slot) => slot.status === "FREE")
  ).length;
  const availableSlots = todayAvailability?.courts.reduce(
    (total, court) => total + court.slots.filter((slot) => slot.status === "FREE").length,
    0
  );
  const totalCourts = todayAvailability?.courts.length ?? club?.court_count ?? null;
  const dashboardStatus = dashboardLoading
    ? "Actualizando datos"
    : todayAvailability || myReservations.length > 0
      ? "Datos actualizados"
      : "Resumen disponible";

  return (
    <div className="home-root">

      {/* ── HERO DINÁMICO DEL CLUB (solo si está autenticado) ── */}
      <AnimatePresence mode="wait">
        {isAuthenticated && club && (
          // Si el usuario tiene club, mostramos su imagen de fondo y su nombre
          <motion.div
            key={club.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <section
              className="home-club-hero"
              style={club.image_url ? { backgroundImage: `url(${club.image_url})` } : {}}
            >
              {/* Overlay oscuro para que el texto sea legible sobre la imagen */}
              <div className="home-overlay" />
              <div className="home-content">
                <span className="home-chip">Tu club</span>
                <div className="home-club-hero-topline">
                  <span className="home-status-pill">
                    <span className="home-status-dot" />
                    Club operativo
                  </span>
                  {club.city && <span className="home-club-location"><FiMapPin /> {club.city}</span>}
                </div>
                <h1 className="home-club-hero-title">{club.name}</h1>
                <p className="home-club-hero-subtitle">
                  Reserva pista, revisa disponibilidad y gestiona tus próximas partidas desde un único panel.
                </p>
                <div className="home-club-hero-actions">
                  <button
                    type="button"
                    className="button"
                    onClick={() => navigate("/reservar")}
                  >
                    <FiCalendar size={18} />
                    Reservar pista
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => navigate("/mis-reservas")}
                  >
                    <FiList size={17} />
                    Ver mis reservas
                  </button>
                </div>
              </div>
            </section>

            {/* Barra con datos básicos del club (ciudad, pistas, descripción) */}
            <section className="home-club-info">
              <div className="home-club-info-inner">
                <div className="home-club-info-item">
                  <FiMapPin size={15} />
                  <span>{club.city}</span>
                </div>
                {club.court_count != null && (
                  <div className="home-club-info-item">
                    <FiGrid size={15} />
                    <span>{club.court_count} pistas disponibles</span>
                  </div>
                )}
                {club.description && (
                  <p className="home-club-info-desc">{club.description}</p>
                )}
              </div>
            </section>
          </motion.div>
        )}

        {/* Si está autenticado pero no tiene club, pedimos que elija uno */}
        {isAuthenticated && !club && (
          <motion.section
            key="no-club"
            className="home-no-club"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p className="home-no-club-title">Selecciona tu club para comenzar</p>
            <p className="home-no-club-desc">
              Elige el club al que perteneces para ver su información aquí.
            </p>
            <button
              type="button"
              className="home-button"
              onClick={() => navigate("/mi-club")}
            >
              Elegir club
            </button>
          </motion.section>
        )}
      </AnimatePresence>

      {isAuthenticated ? (
        <motion.section className="home-dashboard" {...fade(0.08)}>
          <div className="home-dashboard-header">
            <div>
              <span className="home-dashboard-kicker">Panel del jugador</span>
              <h2>Resumen de hoy</h2>
              <p>
                {dashboardLoading
                  ? `Actualizando disponibilidad y reservas para ${userName}.`
                  : `Sesión activa como ${userName}. Revisa tu actividad y reserva en pocos pasos.`}
              </p>
            </div>
            <div className="home-dashboard-status" aria-live="polite">
              <span className={`home-dashboard-dot${dashboardLoading ? " is-loading" : ""}`} />
              {dashboardStatus}
            </div>
            <div className="home-dashboard-actions">
              <button className="button" type="button" onClick={() => navigate("/reservar")}>
                <FiCalendar />
                Reservar pista
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => navigate("/mis-reservas")}
              >
                <FiUser />
                Ver mis reservas
              </button>
            </div>
          </div>

          <div className="home-dashboard-grid">
            <article className="home-summary-card home-summary-card-featured">
              <div className="home-summary-top">
                <div className="home-summary-icon"><FiClock /></div>
                <span className={nextReservation ? "home-card-state is-ready" : "home-card-state is-empty"}>
                  {nextReservation ? "Confirmada" : "Sin actividad"}
                </span>
              </div>
              <span className="home-summary-label">Próxima reserva</span>
              <strong className={nextReservation ? "" : "home-summary-empty-value"}>
                {nextReservation
                  ? `${formatShortDate(nextReservation.reservation_date)} · ${nextReservation.start_time}`
                  : "Sin reserva próxima"}
              </strong>
              <p>
                {nextReservation
                  ? `${nextReservation.court_name} hasta las ${nextReservation.end_time}`
                  : "Cuando reserves una pista, verás aquí la fecha, hora y pista asignada."}
              </p>
              {!nextReservation && (
                <button
                  type="button"
                  className="home-inline-link"
                  onClick={() => navigate("/reservar")}
                >
                  Buscar tramo libre <FiArrowRight />
                </button>
              )}
            </article>

            <article className="home-summary-card">
              <div className="home-summary-top">
                <div className="home-summary-icon"><FiGrid /></div>
                <span className="home-card-state is-ready">Hoy</span>
              </div>
              <span className="home-summary-label">Pistas disponibles</span>
              <strong>
                {availableCourts != null
                  ? `${availableCourts}/${totalCourts || "-"}`
                  : club?.court_count != null
                    ? `${club.court_count}`
                    : "Pendiente"}
              </strong>
              <p>
                {availableSlots != null
                  ? `${availableSlots} tramos libres hoy`
                  : "No se pudo confirmar la disponibilidad en vivo. Puedes consultar la parrilla completa."}
              </p>
              <span className="home-summary-meta">
                {todayAvailability ? "Disponibilidad en tiempo real" : "Fallback del club"}
              </span>
            </article>

            <article className="home-summary-card">
              <div className="home-summary-top">
                <div className="home-summary-icon"><FiCheckCircle /></div>
                <span className={activeReservations.length > 0 ? "home-card-state is-ready" : "home-card-state is-empty"}>
                  {activeReservations.length > 0 ? "Activas" : "A cero"}
                </span>
              </div>
              <span className="home-summary-label">Reservas activas</span>
              <strong>{activeReservations.length}</strong>
              <p>
                {activeReservations.length === 1
                  ? "Tienes una reserva pendiente."
                  : activeReservations.length > 1
                    ? "Reservas futuras confirmadas."
                    : "No tienes reservas futuras. Buen momento para planificar partido."}
              </p>
              <button
                type="button"
                className="home-inline-link"
                onClick={() => navigate("/mis-reservas")}
              >
                Gestionar reservas <FiArrowRight />
              </button>
            </article>

            <article className="home-summary-card home-quick-card">
              <div className="home-summary-top">
                <div className="home-summary-icon"><FiActivity /></div>
                <span className="home-card-state">Acciones</span>
              </div>
              <span className="home-summary-label">Acceso rápido</span>
              <strong>Nuevo partido</strong>
              <p>Salta directamente al flujo que necesitas sin volver al menú.</p>
              <div className="home-quick-actions">
                <button
                  type="button"
                  className="home-quick-action"
                  onClick={() => navigate("/reservar")}
                >
                  <FiRefreshCw />
                  Disponibilidad
                </button>
                <button
                  type="button"
                  className="home-quick-action"
                  onClick={() => navigate("/mis-reservas")}
                >
                  <FiList />
                  Mis reservas
                </button>
              </div>
            </article>
          </div>
        </motion.section>
      ) : (
      <motion.section className="home-hero" {...fade(0)}>
        <div className="home-hero-content">
          <span className="home-chip">App de reservas · Pádel</span>

          {/* El título cambia dependiendo de si hay sesión iniciada o no */}
          <h1 className="home-hero-title">
            {isAuthenticated
              ? `Bienvenido, ${userEmail?.split("@")[0]}`
              : "Reserva tu pista de pádel en segundos"}
          </h1>

          <p className="home-hero-subtitle">
            {isAuthenticated
              ? "Consulta disponibilidad, elige tu tramo y gestiona tus reservas desde aquí."
              : "Consulta la disponibilidad, elige tu horario y gestiona tus reservas desde una interfaz limpia y directa."}
          </p>

          <div className="home-hero-actions">
            <button
              className="button"
              type="button"
              onClick={() => navigate("/reservar")}
            >
              <FiCalendar />
              {isAuthenticated ? "Reservar pista" : "Ver disponibilidad"}
            </button>

            {isAuthenticated ? (
              <button
                className="button-secondary"
                type="button"
                onClick={() => navigate("/mis-reservas")}
              >
                <FiUser />
                Mis reservas
              </button>
            ) : (
              <button
                className="button-secondary"
                type="button"
                onClick={() => navigate("/login")}
              >
                <FiLogIn />
                Iniciar sesión
              </button>
            )}
          </div>
        </div>

        {/* Panel lateral: formulario de login si no hay sesión, accesos rápidos si sí la hay */}
        <motion.aside className="home-login-panel" {...fade(0.1)}>
          {!isAuthenticated ? (
            <>
              <div className="home-login-header">
                <span className="home-chip">Acceso rápido</span>
                <h2 className="home-login-title">Entrar en Padex</h2>
                <p className="home-login-subtitle">
                  Inicia sesión para reservar y ver tus partidos.
                </p>
              </div>

              <form className="home-login-form" onSubmit={handleLogin}>
                <div className="home-login-field">
                  <label htmlFor="home-email">Correo electrónico</label>
                  <input
                    id="home-email"
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="tuemail@ejemplo.com"
                  />
                </div>

                <div className="home-login-field">
                  <label htmlFor="home-password">Contraseña</label>
                  <input
                    id="home-password"
                    className="input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                  />
                </div>

                <button
                  type="submit"
                  className="button home-login-button"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Iniciar sesión"}
                </button>

                <button
                  type="button"
                  className="button-secondary home-login-button"
                  onClick={() => navigate("/register")}
                >
                  Crear cuenta
                </button>

                {msg   && <p className="home-login-info home-login-info--ok">{msg}</p>}
                {error && <p className="home-login-info home-login-info--err">{error}</p>}
              </form>
            </>
          ) : (
            <>
              <div className="home-login-header">
                <span className="home-chip">Sesión activa</span>
                <h2 className="home-login-title">Hola, {userEmail?.split("@")[0]}</h2>
                <p className="home-login-subtitle">
                  Accede directamente a las funciones principales.
                </p>
              </div>

              <div className="home-login-logged">
                <button
                  className="button home-login-button"
                  type="button"
                  onClick={() => navigate("/reservar")}
                >
                  <FiCalendar />
                  Reservar pista
                </button>

                <button
                  className="button-secondary home-login-button"
                  type="button"
                  onClick={() => navigate("/mis-reservas")}
                >
                  <FiArrowRight />
                  Ver mis reservas
                </button>
              </div>
            </>
          )}
        </motion.aside>
      </motion.section>
      )}

      {/* ── FUNCIONALIDADES ── */}
      {!isAuthenticated && <motion.section className="home-features" {...fade(0.15)}>
        <div className="home-section-header">
          <h2>Todo lo que necesitas</h2>
          <p>Funciones pensadas para que reservar sea simple y rápido.</p>
        </div>

        <div className="home-features-grid">
          {FEATURES.map((f) => (
            <article key={f.tag} className="home-feature-card">
              <div className="home-feature-icon">{f.icon}</div>
              <span className="home-feature-tag">{f.tag}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </motion.section>}

      {/* ── CÓMO FUNCIONA ── */}
      {!isAuthenticated && <motion.section className="home-steps" {...fade(0.2)}>
        <div className="home-section-header">
          <h2>Cómo funciona</h2>
          <p>Tres pasos para tener tu pista reservada.</p>
        </div>

        <div className="home-steps-grid">
          {STEPS.map((s) => (
            <div key={s.n} className="home-step">
              <span className="home-step-number">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>}

      {/* ── CTA FINAL (solo si no hay sesión) ── */}
      {!isAuthenticated && (
        <motion.section className="home-cta" {...fade(0.25)}>
          <div className="home-cta-content">
            <h2>¿Listo para jugar?</h2>
            <p>
              Crea tu cuenta gratis y reserva tu primera pista en menos de un minuto.
            </p>
            <div className="home-cta-actions">
              <button
                className="button"
                type="button"
                onClick={() => navigate("/register")}
              >
                Crear cuenta gratis
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={() => navigate("/reservar")}
              >
                Ver disponibilidad
                <FiArrowRight />
              </button>
            </div>
          </div>
        </motion.section>
      )}

    </div>
  );
}
