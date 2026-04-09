import { useEffect, useState, type ChangeEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

type ClubOption = {
  id: string;
  name: string;
};

const CLUBS: ClubOption[] = [
  { id: 'none', name: 'Sin club asociado (demo)' },
  { id: 'padel-center', name: 'Padel Center Ciudad' },
  { id: 'club-norte', name: 'Club Pádel Norte' },
  { id: 'indoor-sur', name: 'Indoor Pádel Sur' },
];

export default function Sidebar() {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [selectedClub, setSelectedClub] = useState<string>('none');
  const [now, setNow] = useState<string>('');

  const getClassName = ({ isActive }: { isActive: boolean }) =>
    'sidebar-link' + (isActive ? ' sidebar-link-active' : '');

  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });

  const selectedClubName =
    CLUBS.find((c) => c.id === selectedClub)?.name ?? CLUBS[0].name;

  // Reloj simple
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

  useEffect(() => {
    try {
      const stored = localStorage.getItem('padel_club');
      if (stored) setSelectedClub(stored);
    } catch {
      
    }
  }, []);

  function handleChangeClub(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setSelectedClub(value);
    try {
      localStorage.setItem('padel_club', value);
    } catch {
      // ignoramos errores
    }
  }

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
            Inicia sesión o entra como invitado para acceder a las reservas.
          </span>
        )}

        <div className="sidebar-section-title">Acceso rápido</div>
        <div className="sidebar-actions">
          <motion.button
            type="button"
            className="sidebar-button"
            whileHover={{ scale: isAuthenticated ? 1.02 : 1 }}
            whileTap={{ scale: isAuthenticated ? 0.98 : 1 }}
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

        <div className="sidebar-section-title">Próximas mejoras</div>
        <div className="sidebar-tag">Club asociado</div>
        <div className="sidebar-tag">Panel del club</div>
        <div className="sidebar-tag">Estadísticas de uso</div>
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

      <div className="sidebar-block">
        <div className="sidebar-block-title">Club (demo)</div>
        <label className="sidebar-club-label">
          Club seleccionado
          <select
            value={selectedClub}
            onChange={handleChangeClub}
            className="sidebar-select"
          >
            {CLUBS.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>
        <p className="sidebar-project-text">
          En la versión conectada al backend, este selector se enlazará con los clubes reales del
          sistema. Actualmente se guarda solo en tu navegador.
        </p>
        <p className="sidebar-project-text" style={{ marginTop: 4 }}>
          Club actual: <strong>{selectedClubName}</strong>
        </p>
      </div>

      <div className="sidebar-footer">
        <p>Demo académica – Padel Booking</p>
      </div>
    </motion.aside>
  );
}