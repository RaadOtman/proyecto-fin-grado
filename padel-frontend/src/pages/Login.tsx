import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, login, logout } = useAuth();

  const [email, setEmail] = useState(userEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => {
    return email.trim().includes("@") && password.length >= 4 && !loading;
  }, [email, password, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);

    try {
      // ✅ Login REAL contra backend: devuelve { token, user: { email } } (o similar)
      const res = await loginUser(email.trim(), password);

      // ✅ Guardar token si existe
      if (res?.token) localStorage.setItem("padel_token", res.token);

      // ✅ Guardar sesión (email) en tu AuthContext
      login(email.trim());

      setMsg("✅ Sesión iniciada correctamente");
      setPassword("");

      // ✅ ir a reservar
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
    setMsg("✅ Sesión cerrada");
    setError("");
    setPassword("");
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🎾</div>
          <div>
            <h1 style={styles.h1}>Acceso</h1>
            <p style={styles.sub}>
              Inicia sesión para reservar y ver “Mis reservas”.
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <div style={styles.box}>
            <div style={styles.rowBetween}>
              <div>
                <div style={styles.label}>Sesión activa</div>
                <div style={styles.userLine}>
                  👤 <strong>{userEmail}</strong>
                </div>
              </div>

              <button onClick={onLogout} style={styles.btnDanger}>
                🚪 Cerrar sesión
              </button>
            </div>

            {msg && <div style={{ ...styles.alert, ...styles.ok }}>{msg}</div>}

            <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
              <button onClick={() => navigate("/reservar")} style={styles.btnGhost}>
                🎾 Ir a reservar
              </button>
              <button onClick={() => navigate("/mis-reservas")} style={styles.btnGhost}>
                📋 Mis reservas
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} style={{ marginTop: 10 }}>
            <label style={styles.field}>
              <span style={styles.label}>Email</span>
              <div style={styles.inputWrap}>
                <span style={styles.icon}>📧</span>
                <input
                  style={styles.input}
                  type="email"
                  placeholder="tuemail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Contraseña</span>
              <div style={styles.inputWrap}>
                <span style={styles.icon}>🔑</span>
                <input
                  style={styles.input}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={styles.eyeBtn}
                  title={showPass ? "Ocultar" : "Mostrar"}
                >
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
              <div style={styles.hint}>* Mínimo 4 caracteres</div>
            </label>

            {error && <div style={{ ...styles.alert, ...styles.err }}>{error}</div>}
            {msg && <div style={{ ...styles.alert, ...styles.ok }}>{msg}</div>}

            <button type="submit" disabled={!canSubmit} style={styles.btnPrimary}>
              {loading ? "⏳ Entrando..." : "✅ Iniciar sesión"}
            </button>

            <div style={styles.footerRow}>
              <button
                type="button"
                onClick={() => navigate("/reservar")}
                style={styles.btnGhost}
              >
                ← Volver a Reservar
              </button>

              <span style={styles.smallMuted}>
                Si falla, revisa backend + tabla <code>users</code>.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "calc(100vh - 140px)",
    display: "grid",
    placeItems: "center",
    padding: 16,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    background:
      "radial-gradient(1200px 600px at 20% 10%, rgba(99,102,241,0.18), transparent 50%), radial-gradient(900px 500px at 80% 30%, rgba(16,185,129,0.16), transparent 50%), #0b1220",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 20,
    padding: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    backdropFilter: "blur(10px)",
    color: "rgba(255,255,255,0.92)",
  },
  header: { display: "flex", gap: 12, alignItems: "center" },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 20,
  },
  h1: { margin: 0, fontSize: 22, letterSpacing: -0.2 },
  sub: { margin: "6px 0 0", fontSize: 13, opacity: 0.75 },
  box: {
    marginTop: 14,
    borderRadius: 16,
    padding: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
  },
  field: { display: "block", marginTop: 12 },
  label: { fontSize: 12, opacity: 0.78 },
  inputWrap: {
    marginTop: 6,
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 10px",
    borderRadius: 14,
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  icon: { width: 20, textAlign: "center", opacity: 0.85 },
  input: {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
  },
  eyeBtn: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  hint: { marginTop: 6, fontSize: 12, opacity: 0.6 },
  alert: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 14,
    fontSize: 13,
    border: "1px solid rgba(255,255,255,0.12)",
  },
  ok: { background: "rgba(34,197,94,0.14)" },
  err: { background: "rgba(239,68,68,0.14)" },
  btnPrimary: {
    width: "100%",
    marginTop: 12,
    borderRadius: 14,
    padding: "11px 12px",
    cursor: "pointer",
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.16)",
    background:
      "linear-gradient(180deg, rgba(99,102,241,0.85), rgba(99,102,241,0.55))",
    color: "white",
  },
  btnGhost: {
    borderRadius: 12,
    padding: "9px 10px",
    cursor: "pointer",
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
  },
  btnDanger: {
    borderRadius: 12,
    padding: "9px 10px",
    cursor: "pointer",
    fontWeight: 900,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.15)",
    color: "white",
  },
  footerRow: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  smallMuted: { fontSize: 12, opacity: 0.6, textAlign: "right" },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  userLine: { marginTop: 6, fontSize: 14 },
};