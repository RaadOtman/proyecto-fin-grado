import { Link, useLocation } from "react-router-dom";
import padexLogo from "../assets/padex-logo.svg";

export default function Footer() {
  const year = new Date().getFullYear();
  const location = useLocation();

  if (location.pathname.startsWith("/admin")) return null;

  const isAuth = location.pathname === "/login" || location.pathname === "/register";

  return (
    <footer className={`footer ${isAuth ? "footer-compact" : ""}`}>
      <div className="footer-inner">
        <div className="footer-brand-block">
          <Link to="/" className="footer-brand">
            <img src={padexLogo} alt="PADEX" />
            <span>PADEX</span>
          </Link>
          {!isAuth && (
            <p>Plataforma de reservas y operación para clubes de pádel.</p>
          )}
        </div>

        {!isAuth && (
          <nav className="footer-links" aria-label="Footer">
            <Link to="/">Inicio</Link>
            <Link to="/reservar">Reservar</Link>
            <Link to="/register">Para clubes</Link>
            <Link to="/login">Contacto</Link>
          </nav>
        )}

        <div className="footer-legal">
          <span>© {year} PADEX</span>
          <span>Plataforma de reservas para clubes de pádel</span>
        </div>
      </div>
    </footer>
  );
}
