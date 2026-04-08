// Protege las rutas /admin/*.
// Si no está autenticado → redirige a /login.
// Si está autenticado pero no es admin → redirige a / (acceso denegado).
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}
