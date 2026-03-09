import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, logout } = useAuth();

  function onLogout() {
    logout();
    localStorage.removeItem("padel_token");
    navigate("/login");
  }

  return (
    <header style={styles.wrap}>
      <div style={styles.inner}>
        <Link to="/" style={styles.brand}>
          <span style={styles.brandIcon}>🎾</span>
          <span style={styles.brandText}>Padel Booking</span>
        </Link>

        <nav style={styles.nav}>
          <NavLink to="/" style={navLinkStyle}>
            Inicio
          </NavLink>

          <NavLink to="/reservar" style={navLinkStyle}>
            Reservar
          </NavLink>

          {/* ✅ Solo mostrar Mis reservas si hay sesión */}
          {isAuthenticated && (
            <NavLink to="/mis-reservas" style={navLinkStyle}>
              Mis reservas
            </NavLink>
          )}
        </nav>

        <div style={styles.right}>
          {isAuthenticated ? (
            <>
              <span style={styles.userPill} title={userEmail ?? ""}>
                👤 {userEmail}
              </span>
              <button onClick={onLogout} style={styles.logoutBtn}>
                🚪 Salir
              </button>
            </>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
            <Link to="/login" style={styles.loginBtn}>🔐 Login</Link>
            <Link to="/register" style={styles.registerBtn}>🟢 Registro</Link>
          </div> 
          )}
        </div>
      </div>
    </header>
  );
}

function navLinkStyle({ isActive }: { isActive: boolean }) {
  return {
    ...styles.link,
    ...(isActive ? styles.linkActive : null),
  } as React.CSSProperties;
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(10px)",
    background: "rgba(11,18,32,0.72)",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },
  inner: {
    maxWidth: 1050,
    margin: "0 auto",
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    color: "rgba(255,255,255,0.92)",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: "rgba(255,255,255,0.92)",
    fontWeight: 900,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  brandText: { letterSpacing: -0.2 },

  nav: { display: "flex", gap: 10, alignItems: "center" },
  link: {
    textDecoration: "none",
    color: "rgba(255,255,255,0.78)",
    fontWeight: 800,
    fontSize: 13,
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid transparent",
  },
  linkActive: {
    color: "white",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  right: { display: "flex", gap: 10, alignItems: "center" },
  authLinks: { display: "flex", gap: 10, alignItems: "center" },

  userPill: {
    fontSize: 12,
    padding: "7px 10px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    maxWidth: 230,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  loginBtn: {
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 13,
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "white",
  },

  // ✅ Nuevo estilo para Registro
  registerBtn: {
    textDecoration: "none",
    fontWeight: 900,
    fontSize: 13,
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.16)",
    color: "white",
  },

  logoutBtn: {
    fontWeight: 900,
    fontSize: 13,
    padding: "9px 12px",
    borderRadius: 12,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.15)",
    color: "white",
    cursor: "pointer",
  },
};