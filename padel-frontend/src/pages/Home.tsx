import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiCalendar,
  FiLogIn,
  FiClock,
  FiCheckCircle,
  FiArrowRight,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

type Feature = {
  id: number;
  title: string;
  text: string;
  tag: string;
};

type NewsItem = {
  id: number;
  title: string;
  text: string;
};

const FEATURES: Feature[] = [
  {
    id: 1,
    title: 'Ver disponibilidad en tiempo real',
    text: 'Consulta rápidamente qué pistas están libres en cada tramo horario.',
    tag: 'Disponibilidad',
  },
  {
    id: 2,
    title: 'Crear y gestionar reservas',
    text: 'Reserva tu pista favorita y gestiona tus próximos partidos.',
    tag: 'Reservas',
  },
  {
    id: 3,
    title: 'Pensado para clubes reales',
    text: 'Preparado para conectarse con backend y base de datos de cada club.',
    tag: 'Clubes',
  },
];

const NEWS: NewsItem[] = [
  {
    id: 1,
    title: 'Nuevos horarios',
    text: 'Partidos hasta las 23:30 los fines de semana.',
  },
  {
    id: 2,
    title: 'Próximamente entrenos',
    text: 'Reservas de clases con entrenadores desde la app.',
  },
  {
    id: 3,
    title: 'Cuida tu salud',
    text: 'Calienta antes de jugar y mantente hidratado.',
  },
];

export default function Home() {
  const { isAuthenticated, loginAsGuest, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('demo@padelbooking.com');
  const [password, setPassword] = useState('demo1234');

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    login(email, password);
  }

  const featureLoop = [...FEATURES, ...FEATURES];
  const newsLoop = [...NEWS, ...NEWS];

  return (
    <div className="home-root">
      {/* FILA SUPERIOR: texto + panel login a la derecha */}
      <motion.section
        className="home-top-row"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* IZQUIERDA: mensaje principal */}
        <div className="home-top-left">
          <span className="home-hero-chip">
            🎾 Reserva tus pistas de pádel en segundos
          </span>
          <h1 className="home-hero-title">
            Gestiona tus partidos de pádel de forma visual, rápida e intuitiva
          </h1>
          <p className="home-hero-subtitle">
            Elige día, revisa la disponibilidad y reserva tu pista favorita sin llamadas
            ni hojas de papel. Pensado para jugadores y clubes que quieren simplificar
            su día a día.
          </p>

          <div className="home-hero-buttons">
            <button
              className="button"
              type="button"
              onClick={() => navigate('/reservar')}
            >
              <FiCalendar />
              Ver disponibilidad
            </button>

            {!isAuthenticated && (
              <button
                className="button-secondary"
                type="button"
                onClick={loginAsGuest}
              >
                <FiLogIn />
                Entrar como invitado
              </button>
            )}
          </div>

          <div className="home-hero-pills">
            <span className="home-pill">
              <FiCheckCircle />
              Reservas rápidas
            </span>
            <span className="home-pill">
              <FiClock />
              Horarios claros
            </span>
            <span className="home-pill">
              <FiCalendar />
              Próximos partidos
            </span>
          </div>
        </div>

        {/* DERECHA: panel dinámico de inicio de sesión */}
        <motion.aside
          className="home-login-panel"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <div className="home-login-header">
            <span className="home-login-tag">Acceso a la app</span>
            <h2 className="home-login-title">Inicia sesión para ver tus pistas</h2>
            <p className="home-login-subtitle">
              Usa el usuario demo o entra como invitado para probar la experiencia.
            </p>
          </div>

          {!isAuthenticated ? (
            <form className="home-login-form" onSubmit={handleLogin}>
              <div className="home-login-field">
                <label>Correo electrónico</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="home-login-field">
                <label>Contraseña</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <button type="submit" className="button home-login-button">
                Iniciar sesión
              </button>
              <button
                type="button"
                className="button-secondary home-login-guest"
                onClick={loginAsGuest}
              >
                Entrar como invitado
              </button>

              <p className="home-login-demo-info">
                Usuario demo pensado para mostrar la app como proyecto fin de grado.
              </p>
            </form>
          ) : (
            <div className="home-login-logged">
              <p>Ya has iniciado sesión.</p>
              <button
                className="button home-login-button"
                type="button"
                onClick={() => navigate('/mis-reservas')}
              >
                Ver mis reservas
              </button>
            </div>
          )}
        </motion.aside>
      </motion.section>

      {/* FILA CENTRAL: contenedores deslizables + vista previa app */}
      <motion.section
        className="home-middle-row"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {/* Centro: contenedores deslizables (features) */}
        <div className="home-features-area">
          <div className="home-features-header">
            <h2>Qué puedes hacer con Padel Booking</h2>
            <p>
              Contenedores deslizables que resumen la funcionalidad principal de la
              aplicación.
            </p>
          </div>
          <div className="home-feature-scroll">
            <div className="home-feature-track">
              {featureLoop.map((f, index) => (
                <motion.article
                  key={`${f.id}-${index}`}
                  className="home-feature-card"
                  whileHover={{
                    y: -4,
                    boxShadow: '0 12px 24px rgba(15,23,42,0.15)',
                  }}
                  transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                >
                  <span className="home-feature-tag">{f.tag}</span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  <button
                    type="button"
                    className="home-feature-link"
                    onClick={() => navigate('/reservar')}
                  >
                    Ver en la app <FiArrowRight />
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </div>

        {/* Derecha: vista previa de la app tras iniciar sesión (placeholder) */}
        <div className="home-preview-panel">
          <h2>Vista previa tras iniciar sesión</h2>
          <p>
            Aquí se mostrará una captura o mockup de la interfaz real donde se ven las
            pistas, horarios y tus próximas reservas. De momento lo dejamos como espacio
            reservado para la siguiente fase del proyecto.
          </p>
          <div className="home-preview-blank">
            <span>Vista previa de la app</span>
            <small>(pendiente de configurar)</small>
          </div>
        </div>
      </motion.section>

      {/* NOTICIAS / AVISOS ABAJO (opcionales y ligeros) */}
      <motion.section
        className="home-news-strip-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="home-news-strip-header">
          <h2>Actualidad y avisos del club</h2>
          <p>Ejemplo de mensajes que el club podría publicar para los jugadores.</p>
        </div>

        <div className="home-news-scroll">
          <div className="home-news-track">
            {newsLoop.map((n, index) => (
              <motion.article
                key={`${n.id}-${index}`}
                className="home-news-card"
                whileHover={{
                  y: -3,
                  boxShadow: '0 10px 20px rgba(15,23,42,0.12)',
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              >
                <h3>{n.title}</h3>
                <p>{n.text}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}