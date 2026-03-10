import { useState } from "react";
import { loginUser } from "../lib/apiClient";

export default function LoginPadex() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      setMensaje("");
      setError("");

      const data = await loginUser(email, password);

      localStorage.setItem("padel_token", data.token);
      localStorage.setItem("padel_user", JSON.stringify(data.user));

      setMensaje("Login correcto");
    } catch (err) {
      const mensajeError =
        err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(mensajeError);
    }
  }

  function cerrarSesion() {
    localStorage.removeItem("padel_token");
    localStorage.removeItem("padel_user");
    setMensaje("Sesión cerrada");
    setError("");
  }

  return (
    <section style={{ marginBottom: "24px" }}>
      <h2>Iniciar sesión</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit">Entrar</button>
        <button
          type="button"
          onClick={cerrarSesion}
          style={{ marginLeft: "10px" }}
        >
          Cerrar sesión
        </button>
      </form>

      {mensaje && <p>{mensaje}</p>}
      {error && <p>{error}</p>}
    </section>
  );
}