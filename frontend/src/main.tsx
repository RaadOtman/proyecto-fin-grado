import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";      // estilos base
import "./styles.css";     // estilos de la app
import { AuthProvider } from "./context/AuthContext";

// Punto de entrada de la aplicación
// Envolvemos todo en BrowserRouter para que funcionen las rutas
// y en AuthProvider para que cualquier componente pueda acceder al estado de sesión
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
