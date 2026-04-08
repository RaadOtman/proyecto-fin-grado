import { createContext, useContext, useState } from 'react';
import { logoutUser } from '../lib/apiClient';

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  login: (email: string, role?: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lee localStorage de forma síncrona — se usa como initializer de useState,
// por lo que se ejecuta en el primer render, no después.
function readStoredUser() {
  try {
    const raw = localStorage.getItem('padel_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email) {
        return { email: parsed.email as string, role: (parsed.role as string) || 'user' };
      }
    }
  } catch {}
  return { email: null, role: 'user' };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!readStoredUser().email
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(
    () => readStoredUser().role === 'admin'
  );
  const [userEmail, setUserEmail] = useState<string | null>(
    () => readStoredUser().email
  );

  function login(email: string, role = 'user') {
    setIsAuthenticated(true);
    setUserEmail(email);
    setIsAdmin(role === 'admin');
    localStorage.setItem('padel_user', JSON.stringify({ email, role }));
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      // si falla la llamada, igual limpiamos el estado local
    }
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserEmail(null);
    localStorage.removeItem('padel_user');
    localStorage.removeItem('padel_token');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
