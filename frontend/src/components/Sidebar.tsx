import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { isAuthenticated, isAdmin, clubName } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState<string>('');

  const getClassName = ({ isActive }: { isActive: boolean }) =>
    'sidebar-link' + (isActive ? ' sidebar-link-active' : '');

  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });

  useEffect(() => {
    const updateTime = () => {
      setNow(
        new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const id = setInterval(updateTime, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -12, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      <div className="sidebar-header">
        <span className="sidebar-title">Panel principal</span>
        <span className="sidebar-subtitle">Navegación y resumen</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" className={getClassName} end>
          🏠 Inicio
        </NavLink>

        {isAuthenticated && (
          <>
            <NavLink to="/reservar" className={getClassName}>
              🎾 Reservar pista
            </NavLink>
            <NavLink to="/mis-reservas" className={getClassName}>
              📅 Mis reservas
            </NavLink>
            <NavLink to="/mi-club" className={getClassName}>
              🏟️ Mi club
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin/dashboard" className={getClassName}>
                ⚙️ Panel Admin
              </NavLink>
            )}
          </>
        )}

        {!isAuthenticated && (
          <span className="sidebar-hint">
            Inicia sesión para acceder a las reservas.
          </span>
        )}

        <div className="sidebar-section-title">Acceso rápido</div>
        <div className="sidebar-actions">
          <motion.button
            type="button"
            className="sidebar-button primary"
            whileHover={{ scale: isAuthenticated ? 1.01 : 1 }}
            whileTap={{ scale: isAuthenticated ? 0.99 : 1 }}
            onClick={() => navigate('/reservar')}
            disabled={!isAuthenticated}
          >
            + Nueva reserva
          </motion.button>

          <motion.button
            type="button"
            className="sidebar-button secondary"
            whileHover={{ scale: isAuthenticated ? 1.02 : 1 }}
            whileTap={{ scale: isAuthenticated ? 0.98 : 1 }}
            onClick={() => navigate('/mis-reservas')}
            disabled={!isAuthenticated}
          >
            Ver mis reservas
          </motion.button>
        </div>
      </nav>

      <div className="sidebar-block">
        <div className="sidebar-block-title">Resumen de hoy</div>
        <div className="sidebar-stats">
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">Fecha</span>
            <span className="sidebar-stat-value">{today}</span>
          </div>
          <div className="sidebar-stat">
            <span className="sidebar-stat-label">Hora</span>
            <span className="sidebar-stat-value">{now}</span>
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="sidebar-block">
          <div className="sidebar-block-title">Mi club</div>
          {clubName ? (
            <div className="sidebar-club-card">
              <span className="sidebar-club-dot" />
              <p className="sidebar-club-name">{clubName}</p>
            </div>
          ) : (
            <div className="sidebar-club-card">
              <span className="sidebar-club-dot inactive" />
              <p className="sidebar-club-empty">
                Sin club —{' '}
                <button
                  type="button"
                  className="sidebar-club-link"
                  onClick={() => navigate('/mi-club')}
                >
                  seleccionar
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="sidebar-footer">
        <p>Padex</p>
      </div>
    </motion.aside>
  );
}
