import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiCalendar, FiLogIn, FiUser, FiArrowRight } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../lib/apiClient";

export default function Home() {
  const { isAuthenticated, userEmail, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("otman@padex.com");
  const [password, setPassword] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);

    try {
      const res = await loginUser(email.trim(), password);

      if (res?.token) {
        localStorage.setItem("padel_token", res.token);
      }

      login(email.trim());
      setMsg("Sesión iniciada correctamente");
      setTimeout(() => navigate("/reservar"), 500);
    } catch (err: any) {
      setError(err?.message || "No se pudo iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="home-root"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.section
        className="home-top-row"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="home-top-left">
          <span className="home-hero-chip">Padex</span>

          {!isAuthenticated ? (
            <>
              <h1 className="home-hero-title">
                Reserva tu pista de pádel de forma rápida y sencilla
              </h1>

              <p className="home-hero-subtitle">
                Consulta la disponibilidad, elige tu horario y gestiona tus
                reservas desde una interfaz clara y cómoda.
              </p>

              <div className="home-hero-buttons">
                <button
                  className="button"
                  type="button"
                  onClick={() => navigate("/reservar")}
                >
                  <FiCalendar />
                  Ver disponibilidad
                </button>

                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => navigate("/login")}
                >
                  <FiLogIn />
                  Iniciar sesión
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="home-hero-title">Bienvenido de nuevo a Padex</h1>

              <p className="home-hero-subtitle">
                Ya puedes consultar pistas disponibles, crear nuevas reservas o
                revisar las que ya tienes activas.
              </p>

              <div className="home-hero-buttons">
                <button
                  className="button"
                  type="button"
                  onClick={() => navigate("/reservar")}
                >
                  <FiCalendar />
                  Reservar pista
                </button>

                <button
                  className="button-secondary"
                  type="button"
                  onClick={() => navigate("/mis-reservas")}
                >
                  <FiUser />
                  Mis reservas
                </button>
              </div>
            </>
          )}
        </div>

        <motion.aside
          className="home-login-panel"
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          {!isAuthenticated ? (
            <>
              <div className="home-login-header">
                <span className="home-login-tag">Acceso rápido</span>
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
                  className="button-secondary home-login-guest"
                  onClick={() => navigate("/register")}
                >
                  Crear cuenta
                </button>

                {msg && <p className="home-login-demo-info">{msg}</p>}

                {error && (
                  <p
                    className="home-login-demo-info"
                    style={{ color: "#fca5a5" }}
                  >
                    {error}
                  </p>
                )}
              </form>
            </>
          ) : (
            <>
              <div className="home-login-header">
                <span className="home-login-tag">Sesión activa</span>
                <h2 className="home-login-title">Hola, {userEmail}</h2>
                <p className="home-login-subtitle">
                  Accede directamente a las funciones principales de la app.
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
                  className="button-secondary home-login-guest"
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

      <motion.section
        className="home-middle-row"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <div className="home-features-area">
          <div className="home-features-header">
            <h2>Qué puedes hacer en Padex</h2>
            <p>Las funciones principales, sin complicaciones.</p>
          </div>

          <div className="home-feature-track">
            <article className="home-feature-card">
              <span className="home-feature-tag">Disponibilidad</span>
              <h3>Consultar horarios</h3>
              <p>Revisa qué pistas están libres antes de reservar.</p>
            </article>

            <article className="home-feature-card">
              <span className="home-feature-tag">Reserva</span>
              <h3>Reservar en segundos</h3>
              <p>Selecciona fecha, pista y tramo horario de forma rápida.</p>
            </article>

            <article className="home-feature-card">
              <span className="home-feature-tag">Gestión</span>
              <h3>Ver tus reservas</h3>
              <p>Consulta tus próximas reservas y cancela si lo necesitas.</p>
            </article>
          </div>
        </div>

        <div className="home-preview-panel">
          <h2>Interfaz clara para el usuario</h2>
          <p>
            Padex está pensada para que cualquier usuario pueda entrar, ver
            disponibilidad y reservar sin perderse entre pantallas o menús.
          </p>

          <div className="home-preview-blank">
            <span>Simple, rápida y directa</span>
            <small>Menos pasos, menos ruido, más claridad.</small>
          </div>
        </div>
      </motion.section>
    </motion.div>
  );
}