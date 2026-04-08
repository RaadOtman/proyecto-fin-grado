import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import UserLayout from "./components/UserLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/admin/AdminRoute";
import AdminLayout from "./components/admin/AdminLayout";

import Home from "./pages/Home";
import Reserve from "./pages/Reserve";
import MyReservations from "./pages/MyReservations";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsuarios from "./pages/admin/AdminUsuarios";
import AdminReservas from "./pages/admin/AdminReservas";
import AdminPistas from "./pages/admin/AdminPistas";

export default function App() {
  return (
    <div className="app-shell">
      <Header />

      <Routes>
        {/* ── Rutas de usuario (con sidebar normal) ── */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />

          <Route
            path="/reservar"
            element={<ProtectedRoute><Reserve /></ProtectedRoute>}
          />
          <Route
            path="/mis-reservas"
            element={<ProtectedRoute><MyReservations /></ProtectedRoute>}
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ── Rutas de administración (con sidebar admin) ── */}
        <Route
          path="/admin"
          element={<AdminRoute><AdminLayout /></AdminRoute>}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="usuarios" element={<AdminUsuarios />} />
          <Route path="reservas" element={<AdminReservas />} />
          <Route path="pistas" element={<AdminPistas />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </div>
  );
}
