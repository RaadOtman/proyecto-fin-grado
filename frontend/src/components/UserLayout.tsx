// Layout para las rutas normales de usuario.
// Separa la lógica del layout de App.tsx para permitir que /admin use su propio layout.
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function UserLayout() {
  return (
    <div className="app-body">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
