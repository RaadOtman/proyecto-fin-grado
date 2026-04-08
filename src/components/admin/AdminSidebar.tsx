import { NavLink, useNavigate } from "react-router-dom";
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiSquare,
  FiArrowLeft,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const getClass = ({ isActive }: { isActive: boolean }) =>
  "admin-nav-link" + (isActive ? " admin-nav-link-active" : "");

export default function AdminSidebar() {
  const { userEmail, logout } = useAuth();
  const navigate = useNavigate();

  const initials = userEmail ? userEmail[0].toUpperCase() : "A";

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-brand-name">Padex</span>
          <span className="admin-sidebar-brand-tag">Admin</span>
        </div>
      </div>

      <nav className="admin-sidebar-nav">
        <span className="admin-nav-section">Panel</span>

        <NavLink to="/admin/dashboard" className={getClass}>
          <FiGrid size={15} />
          Dashboard
        </NavLink>

        <span className="admin-nav-section">Gestión</span>

        <NavLink to="/admin/usuarios" className={getClass}>
          <FiUsers size={15} />
          Usuarios
        </NavLink>

        <NavLink to="/admin/reservas" className={getClass}>
          <FiCalendar size={15} />
          Reservas
        </NavLink>

        <NavLink to="/admin/pistas" className={getClass}>
          <FiSquare size={15} />
          Pistas
        </NavLink>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">{initials}</div>
          <div className="admin-sidebar-user-info">
            <span className="admin-sidebar-email">{userEmail}</span>
            <span className="admin-sidebar-role">Administrador</span>
          </div>
        </div>

        <div className="admin-sidebar-footer-actions">
          <NavLink to="/" className="admin-back-link">
            <FiArrowLeft size={13} />
            Volver a la app
          </NavLink>
          <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>
            <FiLogOut size={13} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
