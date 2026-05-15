import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../lib/apiClient";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gameLevel, setGameLevel] = useState<"" | "principiante" | "intermedio" | "avanzado">("");
  const [preferredSide, setPreferredSide] = useState<"" | "derecha" | "reves" | "indiferente">("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [accountType, setAccountType] = useState<"player" | "club">("player");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const okName = firstName.trim().length >= 2;
    const okEmail = email.trim().includes("@");
    const okPhone = accountType !== "player" || phone.replace(/[\s().-]/g, "").length >= 7;
    const okPass = password.length >= 4;
    const match = password === password2;
    return okName && okEmail && okPhone && okPass && match && !loading;
  }, [firstName, email, phone, accountType, password, password2, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setError("");
    setLoading(true);

    try {
      await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        accountType,
        gameLevel: accountType === "player" ? gameLevel : "",
        preferredSide: accountType === "player" ? preferredSide : "",
        acceptedTerms,
      });

      const res = await loginUser(email.trim(), password);
      login(
        res.email ?? email.trim(),
        res.role ?? "user",
        res.id ?? null,
        res.club_id ?? null
      );
      setMsg("Cuenta creada correctamente");

      setTimeout(() => {
        navigate(accountType === "club" ? "/onboarding" : "/mi-club");
      }, 400);
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
      <div className="section-panel auth-card">
        <div className="auth-card-header">
          <span className="badge">Padex</span>
          <h1 className="page-title">
            Crear cuenta
          </h1>
          <p className="page-subtitle">
            Crea una cuenta para reservar pistas o gestionar tu club.
          </p>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          <div className="account-type-grid">
            <button
              type="button"
              className={`account-type-card${accountType === "player" ? " account-type-card-active" : ""}`}
              onClick={() => setAccountType("player")}
            >
              <strong>Soy jugador</strong>
              <span>Reserva pistas y elige tus clubes</span>
            </button>
            <button
              type="button"
              className={`account-type-card${accountType === "club" ? " account-type-card-active" : ""}`}
              onClick={() => setAccountType("club")}
            >
              <strong>Soy un club</strong>
              <span>Configura un club de prueba</span>
            </button>
          </div>

          <div className="form-grid-two auth-name-grid">
            <div className="form-group">
              <label htmlFor="register-first-name">Nombre</label>
              <input
                id="register-first-name"
                className="input"
                type="text"
                placeholder="Tu nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="register-last-name">Apellidos</label>
              <input
                id="register-last-name"
                className="input"
                type="text"
                placeholder="Opcional"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="form-group">
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

          {accountType === "player" && (
            <>
              <div className="form-group">
                <label htmlFor="register-phone">Teléfono</label>
                <input
                  id="register-phone"
                  className="input"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                />
                <span className="field-hint">Obligatorio para confirmar reservas y avisos del club.</span>
              </div>

              <div className="form-grid-two">
                <div className="form-group">
                  <label htmlFor="register-level">Nivel de juego</label>
                  <select
                    id="register-level"
                    className="input"
                    value={gameLevel}
                    onChange={(e) => setGameLevel(e.target.value as typeof gameLevel)}
                  >
                    <option value="">Sin indicar</option>
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="register-side">Lado preferido</label>
                  <select
                    id="register-side"
                    className="input"
                    value={preferredSide}
                    onChange={(e) => setPreferredSide(e.target.value as typeof preferredSide)}
                  >
                    <option value="">Sin indicar</option>
                    <option value="derecha">Derecha</option>
                    <option value="reves">Revés</option>
                    <option value="indiferente">Indiferente</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="form-group">
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

          <div className="form-group">
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

          <label className="terms-row">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
            />
            Acepto recibir comunicaciones operativas de PADEX y entiendo que las condiciones legales se completarán antes del lanzamiento público.
          </label>

          {error && <div className="alert alert-error">{error}</div>}
          {msg && <div className="alert alert-success">{msg}</div>}

          <button type="submit" className="button" disabled={!canSubmit}>
            {loading ? "Creando cuenta..." : accountType === "club" ? "Crear cuenta de club" : "Crear cuenta de jugador"}
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
