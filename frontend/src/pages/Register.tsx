import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const okEmail = email.trim().includes("@");
    const okPass = password.length >= 4;
    const match = password === password2;
    return okEmail && okPass && match && !loading;
  }, [email, password, password2, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);

    try {
      await registerUser(email.trim(), password);

      const res = await loginUser(email.trim(), password);
      login(res.email ?? email.trim(), res.role);
      setMsg("Cuenta creada correctamente");

      setTimeout(() => navigate("/reservar"), 400);
    } catch (e: any) {
      setError(e?.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
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
            Crear cuenta
          </h1>
          <p className="page-subtitle">
            Regístrate para reservar pistas y gestionar tus reservas.
          </p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label htmlFor="register-email">Correo electrónico</label>
            <input
              id="register-email"
              className="input"
              type="email"
              placeholder="tuemail@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="register-password">Contraseña</label>
            <input
              id="register-password"
              className="input"
              type="password"
              placeholder="Mínimo 4 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="register-password2">Repite la contraseña</label>
            <input
              id="register-password2"
              className="input"
              type="password"
              placeholder="Repite tu contraseña"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          {password2.length > 0 && password !== password2 && (
            <div className="alert alert-error">Las contraseñas no coinciden.</div>
          )}

          {error && <div className="alert alert-error">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}

          <button type="submit" className="button" disabled={!canSubmit}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>

          <button
            type="button"
            className="button-secondary"
            onClick={() => navigate("/login")}
          >
            Ya tengo cuenta
          </button>
        </form>
      </div>
    </motion.div>
  );
}