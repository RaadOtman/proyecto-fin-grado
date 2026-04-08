// Layout exclusivo del panel de administración.
// Reemplaza el sidebar de usuario por AdminSidebar y usa su propio contenedor.
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout() {
  return (
    <div className="app-body">
      <AdminSidebar />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
