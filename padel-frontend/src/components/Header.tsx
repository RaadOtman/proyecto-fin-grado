import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import padexLogo from "../assets/padex-logo.svg";

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function onLogout() {
    logout();
    localStorage.removeItem("padel_token");
    navigate("/login");
  }

  return (
    <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
      <div className="container header-inner">
        <Link to="/" className="brand">
          <img src={padexLogo} alt="Padex" className="brand-logo" />
        </Link>

        <nav>
          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
            Inicio
          </NavLink>

          <NavLink
            to="/reservar"
            className={({ isActive }) =>
              isActive ? "nav-reserve-link active" : "nav-reserve-link"
            }
          >
            Reservar
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/mis-reservas"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Mis reservas
            </NavLink>
          )}
        </nav>

        <div className="nav-right">
          {isAuthenticated ? (
            <>
              <div className="user-mini">
                <span className="user-avatar">
                  {(userEmail?.[0] || "U").toUpperCase()}
                </span>
                <span className="user-chip">{userEmail}</span>
              </div>

              <button type="button" className="button-secondary" onClick={onLogout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="button-secondary">
                Login
              </Link>

              <Link to="/register" className="button">
                Registro
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}