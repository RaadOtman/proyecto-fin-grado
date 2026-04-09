import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCalendar,
  FiLogIn,
  FiUser,
  FiArrowRight,
  FiSearch,
  FiZap,
  FiList,
  FiMapPin,
  FiGrid,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { loginUser, getClub } from "../lib/apiClient";

type ClubData = {
  id: number;
  name: string;
  city: string;
  description: string | null;
  image_url: string | null;
  maps_url: string | null;
  court_count: number | null;
};

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

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, delay },
});

export default function Home() {
  const { isAuthenticated, userEmail, clubId, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [club, setClub] = useState<ClubData | null>(null);

  useEffect(() => {
    if (clubId) {
      getClub(clubId)
        .then((d) => setClub(d.club ?? null))
        .catch(() => setClub(null));
    } else {
      setClub(null);
    }
  }, [clubId]);

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
      setTimeout(() => navigate(roleFromApi === "admin" ? "/admin/dashboard" : "/reservar"), 500);
    } catch (err: any) {
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home-root">

      {/* ── CLUB HERO (autenticado) ── */}
      <AnimatePresence mode="wait">
        {isAuthenticated && club && (
          <motion.div
            key={club.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hero con imagen del club */}
            <section
              className="home-club-hero"
              style={club.image_url ? { backgroundImage: `url(${club.image_url})` } : {}}
            >
              <div className="home-overlay" />
              <div className="home-content">
                <span className="home-chip">Tu club</span>
                <h1 className="home-club-hero-title">Bienvenido a {club.name}</h1>
                <p className="home-club-hero-subtitle">
                  Reserva tu pista de pádel en segundos
                </p>
                <button
                  type="button"
                  className="home-button"
                  onClick={() => navigate("/reservar")}
                >
                  <FiCalendar size={18} />
                  Reservar pista
                </button>
              </div>
            </section>

            {/* Info del club */}
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

      {/* ── HERO ── */}
      <motion.section className="home-hero" {...fade(0)}>
        <div className="home-hero-content">
          <span className="home-chip">App de reservas · Pádel</span>

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

        {/* Panel login / bienvenida */}
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

      {/* ── FUNCIONALIDADES ── */}
      <motion.section className="home-features" {...fade(0.15)}>
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
      </motion.section>

      {/* ── CÓMO FUNCIONA ── */}
      <motion.section className="home-steps" {...fade(0.2)}>
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
      </motion.section>

      {/* ── CTA ── */}
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
