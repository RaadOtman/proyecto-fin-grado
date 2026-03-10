import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, login, logout } = useAuth();

  const [email, setEmail] = useState(userEmail ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && password.length >= 4 && !loading;
  }, [email, password, loading]);

  async function onSubmit(e: React.FormEvent) {
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
      setPassword("");
      navigate("/reservar");
    } catch (e: any) {
      setError(e?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  function onLogout() {
    logout();
    localStorage.removeItem("padel_token");
    setMsg("Sesión cerrada");
    setError("");
    setPassword("");
  }

  return (
    <motion.div
      className="auth-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="section-panel" style={{ maxWidth: 420, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <span className="badge">Padex</span>
          <h1 className="page-title" style={{ fontSize: 28, marginTop: 12 }}>
            Iniciar sesión
          </h1>
          <p className="page-subtitle">
            Accede a tu cuenta para reservar y gestionar tus pistas.
          </p>
        </div>

        {isAuthenticated ? (
          <div className="reservation-card">
            <p style={{ marginTop: 0 }}>
              Has iniciado sesión como <strong>{userEmail}</strong>.
            </p>

            {msg && <div className="alert alert-success">{msg}</div>}

            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <button
                type="button"
                className="button"
                onClick={() => navigate("/reservar")}
              >
                Ir a reservar
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={() => navigate("/mis-reservas")}
              >
                Ver mis reservas
              </button>

              <button
                type="button"
                className="btn-danger"
                onClick={onLogout}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="login-email">Correo electrónico</label>
              <input
                id="login-email"
                className="input"
                type="email"
                placeholder="tuemail@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                className="input"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {msg && <div className="alert alert-success">{msg}</div>}

            <button type="submit" className="button" disabled={!canSubmit}>
              {loading ? "Entrando..." : "Iniciar sesión"}
            </button>

            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/register")}
            >
              Crear cuenta
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}