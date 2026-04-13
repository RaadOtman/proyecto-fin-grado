import { createContext, useContext, useState } from 'react';
import { logoutUser } from '../lib/apiClient';

// Aquí definimos qué datos y funciones expone el contexto de autenticación
type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail: string | null;
  userId: number | null;
  clubId: number | null;
  login: (email: string, role?: string, id?: number | null, clubId?: number | null) => void;
  logout: () => Promise<void>;
  updateClub: (clubId: number | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lee los datos del usuario guardados en localStorage al recargar la página
// Así la sesión se mantiene aunque el usuario cierre y vuelva a abrir el navegador
function readStoredUser() {
  try {
    const raw = localStorage.getItem('padel_user');
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.email) {
        return {
          email:  p.email  as string,
          role:   (p.role  as string) || 'user',
          id:     (p.id    as number) || null,
          clubId: (p.clubId as number) || null,
        };
      }
    }
  } catch {}
  return { email: null, role: 'user', id: null, clubId: null };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Intentamos recuperar la sesión guardada antes de iniciar los estados
  const stored = readStoredUser();

  // Estados globales de autenticación accesibles desde cualquier componente
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!stored.email);
  const [isAdmin,         setIsAdmin        ] = useState<boolean>(() => stored.role === 'admin');
  const [userEmail,       setUserEmail      ] = useState<string | null>(() => stored.email);
  const [userId,          setUserId         ] = useState<number | null>(() => stored.id);
  const [clubId,          setClubId         ] = useState<number | null>(() => stored.clubId);

  // Guarda los datos del usuario cuando inicia sesión correctamente
  function login(email: string, role = 'user', id: number | null = null, newClubId: number | null = null) {
    setIsAuthenticated(true);
    setUserEmail(email);
    setIsAdmin(role === 'admin');
    setUserId(id);
    setClubId(newClubId);
    // También lo guardamos en localStorage para que persista entre recargas
    localStorage.setItem('padel_user', JSON.stringify({ email, role, id, clubId: newClubId }));
  }

  // Actualiza solo el club del usuario sin tocar el resto de la sesión
  function updateClub(newClubId: number | null) {
    setClubId(newClubId);
    try {
      const raw = localStorage.getItem('padel_user');
      if (raw) {
        const p = JSON.parse(raw);
        localStorage.setItem('padel_user', JSON.stringify({ ...p, clubId: newClubId }));
      }
    } catch {}
  }

  // Llama al endpoint de logout, limpia todos los estados y borra el localStorage
  async function logout() {
    try {
      await logoutUser();
    } catch {}
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserEmail(null);
    setUserId(null);
    setClubId(null);
    localStorage.removeItem('padel_user');
    localStorage.removeItem('padel_token');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, userEmail, userId, clubId, login, logout, updateClub }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto de forma más cómoda en cualquier componente
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
