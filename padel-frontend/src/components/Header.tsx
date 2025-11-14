import { Link, NavLink } from 'react-router-dom';
import { FaTableTennis } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { isAuthenticated, userEmail, logout } = useAuth();

  const getClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'nav-link nav-link-active' : 'nav-link';

  return (
    <nav>
      <Link to="/" className="brand">
        <FaTableTennis />
        <span>Padel Booking</span>
      </Link>

      <NavLink to="/" className={getClassName} end>
        Inicio
      </NavLink>

      {isAuthenticated && (
        <>
          <NavLink to="/reservar" className={getClassName}>
            Reservar
          </NavLink>
          <NavLink to="/mis-reservas" className={getClassName}>
            Mis reservas
          </NavLink>
        </>
      )}

      <div className="nav-right">
        {isAuthenticated ? (
          <>
            <span className="user-chip">{userEmail}</span>
            <button className="button-secondary" onClick={logout}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <span className="user-chip">Invitado</span>
        )}
      </div>
    </nav>
  );
}