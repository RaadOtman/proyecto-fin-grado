import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Si no está logueado, lo mandamos a la Home
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}