import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [error, setError] = useState<string>("");

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
      // 1) Registrar en backend
      await registerUser(email.trim(), password);

      // 2) (Opcional pero recomendado) loguear automáticamente tras registro
      const res = await loginUser(email.trim(), password);
      if (res?.token) localStorage.setItem("padel_token", res.token);

      // 3) Guardar sesión en tu AuthContext (email)
      login(email.trim());

      setMsg("✅ Usuario creado y sesión iniciada");
      setTimeout(() => navigate("/reservar"), 350);
    } catch (e: any) {
      setError(e?.message || "No se pudo registrar el usuario.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>✍️</div>
          <div>
            <h1 style={styles.h1}>Crear cuenta</h1>
            <p style={styles.sub}>
              Regístrate para reservar y ver “Mis reservas”.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ marginTop: 12 }}>
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
                type="password"
                placeholder="••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div style={styles.hint}>* Mínimo 4 caracteres</div>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Repite la contraseña</span>
            <div style={styles.inputWrap}>
              <span style={styles.icon}>🔁</span>
              <input
                style={styles.input}
                type="password"
                placeholder="••••"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {password2.length > 0 && password !== password2 && (
              <div style={{ ...styles.hint, color: "rgba(239,68,68,0.95)" }}>
                Las contraseñas no coinciden
              </div>
            )}
          </label>

          {error && <div style={{ ...styles.alert, ...styles.err }}>{error}</div>}
          {msg && <div style={{ ...styles.alert, ...styles.ok }}>{msg}</div>}

          <button type="submit" disabled={!canSubmit} style={styles.btnPrimary}>
            {loading ? "⏳ Creando..." : "✅ Crear cuenta"}
          </button>

          <div style={styles.footerRow}>
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={styles.btnGhost}
            >
              ← Ya tengo cuenta
            </button>

            <button
              type="button"
              onClick={() => navigate("/reservar")}
              style={styles.btnGhost}
            >
              Ir a Reservar →
            </button>
          </div>
        </form>
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
    fontSize: 18,
  },
  h1: { margin: 0, fontSize: 22, letterSpacing: -0.2 },
  sub: { margin: "6px 0 0", fontSize: 13, opacity: 0.75 },

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
      "linear-gradient(180deg, rgba(34,197,94,0.85), rgba(34,197,94,0.55))",
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
  footerRow: {
    marginTop: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
};