import { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Intentamos recuperar sesión del localStorage
    try {
      const raw = localStorage.getItem('padel_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) {
          setIsAuthenticated(true);
          setUserEmail(parsed.email);
        }
      }
    } catch {
      // ignoramos errores
    }
  }, []);

  function login(email: string) {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem('padel_user', JSON.stringify({ email }));
  }

  function logout() {
    setIsAuthenticated(false);
    setUserEmail(null);
    localStorage.removeItem('padel_user');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}